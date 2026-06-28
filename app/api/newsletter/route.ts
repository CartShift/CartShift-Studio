import { NextRequest, NextResponse } from 'next/server';
import { subscribeNewsletter } from '@/lib/services/newsletter';
import { logError, createErrorResponse } from '@/lib/error-handler';
import { enforceApiRateLimit, rateLimitHeaders } from '@/lib/utils/api-rate-limit';

const RATE_LIMIT_MAX_REQUESTS = 3;
const RATE_LIMIT_WINDOW = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await enforceApiRateLimit(request, 'newsletter', {
      maxRequests: RATE_LIMIT_MAX_REQUESTS,
      windowMs: RATE_LIMIT_WINDOW,
      allowUserAgentFallback: true,
    });

    if ('response' in rateLimit) {
      return rateLimit.response;
    }

    let body;
    try {
      body = await request.json();
    } catch (_error) {
      return NextResponse.json(createErrorResponse('Invalid JSON in request body', 400), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await subscribeNewsletter(body);

    if (!result.success) {
      return NextResponse.json(createErrorResponse(result.error, result.status), {
        status: result.status,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders(RATE_LIMIT_MAX_REQUESTS, 0),
        },
      });
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimitHeaders(RATE_LIMIT_MAX_REQUESTS, rateLimit.result.remaining),
        },
      }
    );
  } catch (error) {
    logError('Newsletter subscription API error', error);
    return NextResponse.json(createErrorResponse('Failed to process request', 500), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(RATE_LIMIT_MAX_REQUESTS, 0),
      },
    });
  }
}
