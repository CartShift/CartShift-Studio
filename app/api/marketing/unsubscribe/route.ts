import { NextRequest, NextResponse } from 'next/server';
import { unsubscribeMarketingLead } from '@/lib/services/marketing';

export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get('leadId') || '';
  const token = request.nextUrl.searchParams.get('token') || '';
  const locale = request.nextUrl.searchParams.get('locale') === 'he' ? 'he' : 'en';

  if (leadId && token) {
    const result = await unsubscribeMarketingLead({ leadId, token });
    if (!result.success) {
      return NextResponse.redirect(`https://cart-shift.com/${locale}?unsubscribe=failed`);
    }
  }

  const status = leadId && token ? 'success' : 'invalid';
  return NextResponse.redirect(`https://cart-shift.com/${locale}?unsubscribe=${status}`);
}

export async function POST(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get('leadId') || '';
  const token = request.nextUrl.searchParams.get('token') || '';

  if (!leadId || !token) {
    return NextResponse.json(
      { success: false, error: 'Invalid unsubscribe link' },
      { status: 400 }
    );
  }

  const result = await unsubscribeMarketingLead({ leadId, token });
  return NextResponse.json({ success: result.success }, { status: result.success ? 200 : 502 });
}
