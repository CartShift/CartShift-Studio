import { NextRequest, NextResponse } from 'next/server';
import { getPublicProposal } from '@/lib/services/proposals-server';
import { launchAnalyzerBrowser } from '@/lib/services/puppeteer-launch';
import { enforceProposalRateLimit, mapProposalError } from '@/lib/services/proposal-api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Generate the same bilingual, printable proposal the client reviewed. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const limited = await enforceProposalRateLimit(request, 'proposal-pdf', token, 5);
  if (limited) return limited;

  const proposal = await getPublicProposal(token).catch(() => null);
  if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

  const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'he';
  // Never use the request Host header as a browser navigation target.
  const base = process.env.NEXT_PUBLIC_PORTAL_URL ||
    process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.cart-shift.com';
  const safeOrigin = new URL(base);
  if (safeOrigin.protocol !== 'https:' &&
      !(process.env.NODE_ENV === 'development' && safeOrigin.hostname === 'localhost')) {
    return NextResponse.json({ error: 'PDF origin is not configured' }, { status: 503 });
  }
  const url = new URL(`/${locale}/proposal/${encodeURIComponent(token)}`, safeOrigin);
  let browser: Awaited<ReturnType<typeof launchAnalyzerBrowser>> | undefined;
  try {
    browser = await launchAnalyzerBrowser(20_000);
    const page = await browser.newPage();
    await page.setViewport({ width: 1100, height: 1400, deviceScaleFactor: 1 });
    await page.goto(url.href, { waitUntil: 'networkidle0', timeout: 20_000 });
    await page.waitForSelector('[data-proposal-document-loaded]', { timeout: 12_000 });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CartShift-Proposal-v${proposal.proposalVersion ?? 1}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return mapProposalError(error);
  } finally {
    await browser?.close().catch(() => undefined);
  }
}
