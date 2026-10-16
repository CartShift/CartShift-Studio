import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyBearer: vi.fn(),
  verifyCookie: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => name === '__session' ? { value: 'stale-cookie' } : undefined,
  }),
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: {
    verifySessionCookie: mocks.verifyCookie,
    verifyIdToken: mocks.verifyBearer,
  },
}));

import { getServerSession } from '@/lib/auth/server-auth';

describe('server session identity selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyCookie.mockRejectedValue(new Error('Expired cookie'));
    mocks.verifyBearer.mockResolvedValue({
      uid: 'current-user', email: 'current@example.test', email_verified: true,
    });
  });

  it('uses the current Firebase bearer even when an expired session cookie exists', async () => {
    const req = new NextRequest('https://portal.cart-shift.com/api/portal/agency/prospects', {
      headers: { Authorization: 'Bearer current-firebase-token' },
    });
    await expect(getServerSession(req)).resolves.toEqual({
      uid: 'current-user', email: 'current@example.test', emailVerified: true,
    });
    expect(mocks.verifyBearer).toHaveBeenCalledWith('current-firebase-token', true);
    expect(mocks.verifyCookie).not.toHaveBeenCalled();
  });

  it('rejects an invalid bearer instead of falling back to a different cookie identity', async () => {
    mocks.verifyBearer.mockRejectedValue(new Error('Invalid bearer'));
    const req = new NextRequest('https://portal.cart-shift.com/api/portal/agency/prospects', {
      headers: { Authorization: 'Bearer invalid-token' },
    });
    await expect(getServerSession(req)).resolves.toBeNull();
    expect(mocks.verifyCookie).not.toHaveBeenCalled();
  });
});
