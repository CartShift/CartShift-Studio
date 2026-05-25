import { NextRequest, NextResponse } from 'next/server';
import { trackMarketingEmailClick } from '@/lib/services/marketing';

function getSafeTarget(target: string | null) {
  if (!target) return 'https://cart-shift.com/en/contact';

  try {
    const url = new URL(target);
    if (url.hostname === 'cart-shift.com' || url.hostname === 'www.cart-shift.com') {
      return url.toString();
    }
  } catch (_error) {
    return 'https://cart-shift.com/en/contact';
  }

  return 'https://cart-shift.com/en/contact';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const leadId = searchParams.get('leadId') || '';
  const jobId = searchParams.get('jobId') || undefined;
  const token = searchParams.get('token') || '';
  const targetUrl = getSafeTarget(searchParams.get('target'));

  if (leadId && token) {
    await trackMarketingEmailClick({ leadId, jobId, token, targetUrl });
  }

  return NextResponse.redirect(targetUrl);
}
