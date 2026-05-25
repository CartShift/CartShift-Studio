import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeMarketingLead } from '@/lib/services/marketing';

export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get('leadId') || '';
  const token = request.nextUrl.searchParams.get('token') || '';
  const locale = request.nextUrl.searchParams.get('locale') === 'he' ? 'he' : 'en';

  if (leadId && token) {
    await unsubscribeMarketingLead({ leadId, token });
  }

  return NextResponse.redirect(`https://cart-shift.com/${locale}?unsubscribed=1`);
}
