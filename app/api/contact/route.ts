import { NextRequest, NextResponse } from 'next/server';
import { submitContactForm } from '@/lib/services/contact';
import { logError, createErrorResponse } from '@/lib/error-handler';
import { checkRateLimit } from '@/lib/services/rate-limiter';

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp;
  if (ip) {
    return ip;
  }
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `ua:${userAgent}`;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    const rateLimitResult = await checkRateLimit(
      rateLimitKey,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = rateLimitResult.resetAt
        ? Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        : 60;
      return NextResponse.json(
        createErrorResponse('Too many requests. Please try again later.', 429),
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetAt?.toString() || '',
          },
        }
      );
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

    const result = await submitContactForm(body);

    if (!result.success) {
      return NextResponse.json(createErrorResponse(result.error, result.status), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining?.toString() || '0',
        },
      }
    );
  } catch (error) {
    logError('Contact form API error', error);
    return NextResponse.json(createErrorResponse('Failed to process request', 500), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
