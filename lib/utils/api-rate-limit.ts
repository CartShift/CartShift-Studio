import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/error-handler';
import {
  checkServerRateLimit,
  type ServerRateLimitResult,
} from '@/lib/services/server-rate-limiter';

export function getClientIpFromRequest(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = (forwarded ? forwarded.split(',')[0].trim() : realIp?.trim()) || null;
  if (ip && ip !== 'unknown') {
    return ip;
  }
  return null;
}

export function getRateLimitKeyFromRequest(
  request: NextRequest,
  scope: string,
  options?: { allowUserAgentFallback?: boolean }
): string | null {
  const ip = getClientIpFromRequest(request);
  if (ip) {
    return `${scope}:${ip}`;
  }

  if (options?.allowUserAgentFallback) {
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${scope}:ua:${userAgent.slice(0, 120)}`;
  }

  return null;
}

export interface EnforceRateLimitOptions {
  maxRequests: number;
  windowMs: number;
  allowUserAgentFallback?: boolean;
  tooManyRequestsMessage?: string;
}

type EnforceRateLimitSuccess = { result: ServerRateLimitResult; key: string };
type EnforceRateLimitBlocked = { response: NextResponse };

export async function enforceApiRateLimit(
  request: NextRequest,
  scope: string,
  options: EnforceRateLimitOptions
): Promise<EnforceRateLimitSuccess | EnforceRateLimitBlocked> {
  const key = getRateLimitKeyFromRequest(request, scope, {
    allowUserAgentFallback: options.allowUserAgentFallback,
  });

  if (!key) {
    return {
      response: NextResponse.json(
        createErrorResponse(
          'Could not verify your request origin. Please try again from a standard network connection.',
          400
        ),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }

  const result = await checkServerRateLimit(key, options.maxRequests, options.windowMs);

  if (!result.allowed) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return {
      response: NextResponse.json(
        createErrorResponse(
          options.tooManyRequestsMessage ?? 'Too many requests. Please try again later.',
          429
        ),
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': options.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toString(),
          },
        }
      ),
    };
  }

  return { result, key };
}

export function rateLimitHeaders(
  maxRequests: number,
  remaining: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
  };
}
