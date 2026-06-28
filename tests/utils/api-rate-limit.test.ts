import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  enforceApiRateLimit,
  getClientIpFromRequest,
  getRateLimitKeyFromRequest,
  rateLimitHeaders,
} from '@/lib/utils/api-rate-limit';
import { checkServerRateLimit } from '@/lib/services/server-rate-limiter';

vi.mock('@/lib/services/server-rate-limiter', () => ({
  checkServerRateLimit: vi.fn(),
}));

function createRequest(headers: Record<string, string> = {}) {
  return new NextRequest('https://cart-shift.com/api/contact', {
    method: 'POST',
    headers,
  });
}

describe('api-rate-limit', () => {
  beforeEach(() => {
    vi.mocked(checkServerRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetAt: Date.now() + 60_000,
    });
  });

  it('extracts client IP from x-forwarded-for', () => {
    const request = createRequest({ 'x-forwarded-for': '203.0.113.10, 10.0.0.1' });
    expect(getClientIpFromRequest(request)).toBe('203.0.113.10');
    expect(getRateLimitKeyFromRequest(request, 'contact')).toBe('contact:203.0.113.10');
  });

  it('falls back to user agent when configured', () => {
    const request = createRequest({ 'user-agent': 'TestAgent/1.0' });
    expect(getRateLimitKeyFromRequest(request, 'contact')).toBeNull();
    expect(getRateLimitKeyFromRequest(request, 'contact', { allowUserAgentFallback: true })).toBe(
      'contact:ua:TestAgent/1.0'
    );
  });

  it('returns 400 when request origin cannot be verified', async () => {
    const result = await enforceApiRateLimit(createRequest(), 'contact', {
      maxRequests: 5,
      windowMs: 60_000,
    });

    expect('response' in result).toBe(true);
    if ('response' in result) {
      expect(result.response.status).toBe(400);
    }
  });

  it('returns 429 when server rate limit is exceeded', async () => {
    vi.mocked(checkServerRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    const result = await enforceApiRateLimit(
      createRequest({ 'x-forwarded-for': '203.0.113.10' }),
      'contact',
      {
        maxRequests: 5,
        windowMs: 60_000,
      }
    );

    expect('response' in result).toBe(true);
    if ('response' in result) {
      expect(result.response.status).toBe(429);
      expect(result.response.headers.get('Retry-After')).toBeTruthy();
    }
  });

  it('returns remaining quota headers helper values', () => {
    expect(rateLimitHeaders(5, 3)).toEqual({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '3',
    });
  });
});
