import { NextRequest, NextResponse } from 'next/server';
import { captureMarketingLead } from '@/lib/services/marketing';
import { createErrorResponse, logError } from '@/lib/error-handler';
import { checkRateLimit } from '@/lib/services/rate-limiter';

const RATE_LIMIT_MAX_REQUESTS = 8;
const RATE_LIMIT_WINDOW = 60 * 1000;

function getRateLimitKey(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  return ip ? `marketing:${ip}` : `marketing:ua:${request.headers.get('user-agent') || 'unknown'}`;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(
      getRateLimitKey(request),
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        createErrorResponse('Too many requests. Please try again later.', 429),
        {
          status: 429,
        }
      );
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
