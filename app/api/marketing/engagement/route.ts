import { NextRequest, NextResponse } from 'next/server';
import { trackMarketingCtaEngagement } from '@/lib/services/marketing';
import { createErrorResponse, logError } from '@/lib/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body?.leadId || !body?.ctaLocation) {
      return NextResponse.json(createErrorResponse('Missing engagement payload', 400), {
        status: 400,
      });
    }

    const result = await trackMarketingCtaEngagement({
      leadId: body.leadId,
      ctaText: body.ctaText,
      ctaLocation: body.ctaLocation,
      intent: body.intent,
    });

    if (!result.success) {
      return NextResponse.json(createErrorResponse('Failed to track engagement', 500), {
        status: 500,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError('Marketing engagement API error', error);
    return NextResponse.json(createErrorResponse('Failed to track engagement', 500), {
      status: 500,
    });
  }
}
