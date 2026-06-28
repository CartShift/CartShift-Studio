import { NextRequest, NextResponse } from 'next/server';
import { captureMarketingLead } from '@/lib/services/marketing';
import { createErrorResponse, logError } from '@/lib/error-handler';
import { enforceApiRateLimit } from '@/lib/utils/api-rate-limit';

const RATE_LIMIT_MAX_REQUESTS = 8;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforceApiRateLimit(request, 'marketing', {
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW,
      allowUserAgentFallback: true,
    });

    if ('response' in rateLimit) {
      return rateLimit.response;
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(createErrorResponse('Invalid JSON in request body', 400), {
        status: 400,
      });
    }

    const result = await captureMarketingLead(body);
    if (!result.success) {
      return NextResponse.json(createErrorResponse(result.error, result.status), {
        status: result.status,
      });
    }

    return NextResponse.json({ success: true, leadId: result.leadId });
  } catch (error) {
    logError('Marketing capture API error', error);
    return NextResponse.json(createErrorResponse('Failed to process marketing lead', 500), {
      status: 500,
    });
  }
}
