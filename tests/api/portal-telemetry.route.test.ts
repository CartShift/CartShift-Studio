import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ rateLimit: vi.fn(), clientIp: vi.fn() }));
vi.mock('@/lib/services/server-rate-limiter', () => ({ checkServerRateLimit: mocks.rateLimit }));
vi.mock('@/lib/utils/api-rate-limit', () => ({ getClientIpFromRequest: mocks.clientIp }));

import { POST } from '@/app/api/portal/telemetry/route';

const goodEvent = {
  event: 'portal.client_error',
  eventId: '3dc73308-2760-4f7b-8e7f-c1c5c90c65b9',
  category: 'transient',
  code: 'unavailable',
};

function request(event: unknown, origin = 'https://cartshift.test') {
  return new NextRequest('https://cartshift.test/api/portal/telemetry', {
    method: 'POST',
    headers: {
      Origin: origin, 'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });
}

describe('portal client telemetry endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimit.mockResolvedValue({ allowed: true });
    mocks.clientIp.mockReturnValue('127.0.0.1');
  });

  it('rejects requests from another origin before processing the event', async () => {
    const response = await POST(request(goodEvent, 'https://evil.test'));
    expect(response.status).toBe(403);
    expect(mocks.rateLimit).not.toHaveBeenCalled();
  });

  it('accepts small allowlisted metadata without logging customer content', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await POST(request(goodEvent));
      expect(response.status).toBe(202);
      expect(log).toHaveBeenCalledWith('[portal-client-telemetry]', JSON.stringify(goodEvent));
    } finally {
      log.mockRestore();
    }
  });

  it('rejects additional fields rather than logging arbitrary exception text', async () => {
    const response = await POST(request({
      ...goodEvent, message: 'private email buyer@sample.com', stack: 'top secret',
    }));
    expect(response.status).toBe(400);
  });

  it('limits error spam', async () => {
    mocks.rateLimit.mockResolvedValueOnce({ allowed: false });
    expect((await POST(request(goodEvent))).status).toBe(429);
  });
});
