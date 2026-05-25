import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  normalizeStoreUrlInput,
  validateStoreUrlForAnalysis,
  type StoreUrlValidationResult,
} from '@/lib/utils/store-url';

const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 5 * 1024 * 1024;

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; CartShift-StoreAnalyzer/1.0; +https://cart-shift.com/tools/store-analyzer)',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};

function isPrivateIpv4(a: number, b: number): boolean {
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function isPrivateIpAddress(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  if (normalized === '::1') return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  const version = isIP(normalized);
  if (version !== 4) return false;

  const parts = normalized.split('.').map(part => Number(part));
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) return true;

  return isPrivateIpv4(parts[0], parts[1]);
}

async function assertPublicHostname(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  const literalVersion = isIP(host);

  if (literalVersion === 4 || literalVersion === 6) {
    if (isPrivateIpAddress(host)) {
      throw new Error('Invalid store URL. Private or internal network addresses are not allowed.');
    }
    return;
  }

  const resolved = await lookup(host, { all: true, verbatim: true });
  if (resolved.length === 0) {
    throw new Error('Could not resolve store hostname. Please check the URL.');
  }

  if (resolved.some(record => isPrivateIpAddress(record.address))) {
    throw new Error('Invalid store URL. Private or internal network addresses are not allowed.');
  }
}

async function validateRedirectUrl(url: string): Promise<string> {
  const validation = await validateStoreUrlForAnalysis(url);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  return validation.normalizedUrl;
}

export type SafeStoreFetchResult = {
  html: string;
  finalUrl: string;
};

export async function safeFetchStoreHtml(
  storeUrl: string,
  timeoutMs = 15_000
): Promise<SafeStoreFetchResult> {
  const initial = await validateStoreUrlForAnalysis(storeUrl);
  if (!initial.ok) {
    throw new Error(initial.error);
  }

  let currentUrl = initial.normalizedUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const urlObj = new URL(currentUrl);
    await assertPublicHostname(urlObj.hostname);

    const response = await fetch(currentUrl, {
      headers: FETCH_HEADERS,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error(`Store returned redirect (${response.status}) without a location header.`);
      }

      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = await validateRedirectUrl(nextUrl);
      continue;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      throw new Error('Store page is too large to analyze.');
    }

    const html = await response.text();
    if (html.length > MAX_BODY_BYTES) {
      throw new Error('Store page is too large to analyze.');
    }

    return { html, finalUrl: currentUrl };
  }

  throw new Error('Too many redirects while accessing the store URL.');
}

export { normalizeStoreUrlInput, type StoreUrlValidationResult };
