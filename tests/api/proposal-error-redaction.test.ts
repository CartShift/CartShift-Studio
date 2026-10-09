import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/services/server-rate-limiter', () => ({ checkServerRateLimit: vi.fn() }));
vi.mock('@/lib/utils/api-rate-limit', () => ({ getClientIpFromRequest: vi.fn() }));

import { mapProposalError } from '@/lib/services/proposal-api-utils';

describe('public proposal error responses', () => {
  it('does not expose provider secrets or internal exception messages on server failure', async () => {
    const response = mapProposalError(new Error('PayPal order for buyer@example.com failed: token ABC123'));
    expect(response.status).toBe(500);
    const raw = await response.text();
    expect(raw).not.toContain('buyer@example.com');
    expect(raw).not.toContain('ABC123');
    expect(raw).not.toContain('PayPal order');
  });

  it('preserves safe expected errors for API clients', async () => {
    const response = mapProposalError(new Error('NOT_FOUND'));
    expect(response.status).toBe(404);
  });

  it('does not expose Firebase Admin configuration details', async () => {
    const response = mapProposalError(new Error('Firebase Admin is not configured'));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('Firebase Admin');
  });
});
