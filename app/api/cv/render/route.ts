import { inflateRawSync } from 'node:zlib';
import { launchAnalyzerBrowser } from '@/lib/services/puppeteer-launch';
import { renderCvHtml } from '@/lib/cv/cv-print-html';
import { resolveCvPdfAssets } from '@/lib/cv/cv-media';
import {
  cvVariantIds,
  listCVVariants,
  resolveCVVariant,
  type CVVariantId,
  type ResolvedCVVariant,
} from '@/lib/cv/cv-variants';
import { parseCVTailoringInput, resolveTailoredCV } from '@/lib/cv/cv-tailoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MAX_ENCODED_PAYLOAD_CHARS = 16_000;
const MAX_DECOMPRESSED_PAYLOAD_BYTES = 32_000;
const MAX_RENDER_REQUESTS_PER_MINUTE = 12;
const RATE_LIMIT_ENTRY_TTL_MS = 60_000;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class CVRenderError extends Error {}

const rateLimitEntries = new Map<string, RateLimitEntry>();

function getClientKey(request: Request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const key = getClientKey(request);
  const current = rateLimitEntries.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitEntries.set(key, { count: 1, resetAt: now + RATE_LIMIT_ENTRY_TTL_MS });
    return false;
  }

  current.count += 1;
  if (rateLimitEntries.size > 200) {
    for (const [entryKey, entry] of rateLimitEntries) {
      if (entry.resetAt <= now) rateLimitEntries.delete(entryKey);
    }
  }

  return current.count > MAX_RENDER_REQUESTS_PER_MINUTE;
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}

function decodeCompressedPayload(encoded: string) {
  if (encoded.length > MAX_ENCODED_PAYLOAD_CHARS) {
    throw new Error('Encoded CV payload is too large');
  }

  const compressed = Buffer.from(encoded, 'base64url');
  const inflated = inflateRawSync(compressed, {
    maxOutputLength: MAX_DECOMPRESSED_PAYLOAD_BYTES,
  });

  return JSON.parse(inflated.toString('utf8')) as unknown;
}

async function renderPdfBuffer(resolved: ResolvedCVVariant) {
  const browser = await launchAnalyzerBrowser(25_000).catch(error => {
    throw new CVRenderError(
      `Unable to launch CV PDF browser: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  });

  try {
    const resolvedAssets = await resolveCvPdfAssets();
    const html = renderCvHtml(resolved.cv, resolvedAssets);
    const page = await browser.newPage();

    try {
      await page.setContent(html, { waitUntil: 'load', timeout: 15_000 });
      await page.emulateMediaType('print');
      await page.evaluate(async () => {
        if ('fonts' in document) await document.fonts.ready;
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });

      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  } catch (error) {
    if (error instanceof CVRenderError) throw error;
    throw new CVRenderError(
      `Unable to render CV PDF: ${error instanceof Error ? error.message : 'unknown error'}`
    );
  } finally {
    await browser.close().catch(() => undefined);
  }
}

function sanitizeFilename(filename: string) {
  return filename.replace(/["\r\n]/g, '').slice(0, 180);
}

async function pdfResponse(
  resolved: ResolvedCVVariant,
  options: { inline?: boolean; cache?: boolean } = {}
) {
  const buffer = await renderPdfBuffer(resolved);
  const disposition = options.inline ? 'inline' : 'attachment';
  const filename = sanitizeFilename(resolved.filename);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': options.cache
        ? 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
        : 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-CV-Renderer': 'chromium-html',
    },
  });
}

function errorResponse(error: unknown) {
  return jsonResponse(
    { error: error instanceof Error ? error.message : 'Invalid CV render request' },
    error instanceof CVRenderError ? 500 : 400
  );
}

export async function GET(request: Request) {
  if (isRateLimited(request)) {
    return jsonResponse({ error: 'Too many CV render requests. Try again shortly.' }, 429);
  }

  const url = new URL(request.url);
  const payload = url.searchParams.get('payload');
  const variant = url.searchParams.get('variant');
  const inline = url.searchParams.get('inline') === '1';

  try {
    if (payload) {
      const tailoredInput = parseCVTailoringInput(decodeCompressedPayload(payload));
      return pdfResponse(resolveTailoredCV(tailoredInput), { inline, cache: false });
    }

    if (variant) {
      if (!cvVariantIds.includes(variant as CVVariantId)) {
        return jsonResponse(
          { error: `Unknown CV variant: ${variant}`, variants: listCVVariants() },
          404
        );
      }

      return pdfResponse(resolveCVVariant(variant as CVVariantId), { inline, cache: true });
    }

    return jsonResponse({
      endpoint: '/api/cv/render',
      renderer: 'chromium-html',
      variants: listCVVariants(),
      usage: {
        namedVariant: '/api/cv/render?variant=fullstack-healthcare',
        inlineNamedVariant: '/api/cv/render?variant=product-frontend&inline=1',
        tailoredGet:
          'Deflate-raw a JSON tailoring payload, base64url encode it, then pass it as ?payload=<value>.',
        tailoredPost: 'POST the same tailoring payload as application/json.',
      },
      safeguards: [
        'Company, role title, employment dates, duration, and location cannot be overridden.',
        'Payload sizes and text lengths are bounded.',
        'Render requests are rate-limited on a best-effort per-instance basis.',
      ],
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return jsonResponse({ error: 'Too many CV render requests. Try again shortly.' }, 429);
  }

  try {
    const text = await request.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_DECOMPRESSED_PAYLOAD_BYTES) {
      return jsonResponse({ error: 'CV tailoring payload is too large' }, 413);
    }

    const input = parseCVTailoringInput(JSON.parse(text) as unknown);
    return pdfResponse(resolveTailoredCV(input), { cache: false });
  } catch (error) {
    return errorResponse(error);
  }
}
