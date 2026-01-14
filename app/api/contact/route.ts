import { NextRequest, NextResponse } from 'next/server';
import { submitContactForm } from '@/lib/services/contact';
import { logError, createErrorResponse } from '@/lib/error-handler';

/**
 * In-memory rate limiting map.
 * NOTE: This approach works for single-instance deployments but will NOT persist
 * across serverless function invocations (e.g., Vercel). For production serverless
 * environments, consider using Vercel KV, Upstash Redis, or a similar external store.
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

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

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request);

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        createErrorResponse('Too many requests. Please try again later.', 429),
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'Content-Type': 'application/json',
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
        headers: { 'Content-Type': 'application/json' },
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
