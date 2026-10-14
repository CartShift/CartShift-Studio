import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
  queryGet: vi.fn(),
  directGet: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: mocks.verifyIdToken },
  adminDb: {
    collection: () => ({
      where: () => ({ limit: () => ({ get: mocks.queryGet }) }),
      doc: (id: string) => ({ get: () => mocks.directGet(id) }),
    }),
  },
}));

import { POST } from '@/app/api/portal/invites/lookup/route';

const validCode = 'abc123abc123abc123abc123abc123ab';
const request = (code: unknown = validCode, authorization = 'Bearer valid') => new NextRequest(
  'https://portal.cart-shift.com/api/portal/invites/lookup',
  { method: 'POST', headers: { Authorization: authorization, 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }) }
);

const invite = {
  email: 'recipient@example.com', orgId: 'org123', role: 'member', status: 'pending',
  expiresAt: { toMillis: () => 1900000000000 }, createdAt: { toMillis: () => 1800000000000 },
  code: validCode, internalNote: 'Never return this',
};

describe('recipient-scoped invitation lookup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.verifyIdToken.mockResolvedValue({ uid: 'recipient', email: 'recipient@example.com', email_verified: true });
    mocks.queryGet.mockResolvedValue({ docs: [{ id: 'invite123', exists: true, data: () => invite }] });
    mocks.directGet.mockResolvedValue({ exists: false, data: () => undefined });
  });

  it('rejects unauthenticated and invalid identity tokens before Firestore', async () => {
    expect((await POST(request(validCode, ''))).status).toBe(401);
    mocks.verifyIdToken.mockRejectedValue(new Error('Invalid token'));
    expect((await POST(request())).status).toBe(401);
    expect(mocks.queryGet).not.toHaveBeenCalled();
  });

  it('does not allow an unverified account to claim someone else\'s email address', async () => {
    mocks.verifyIdToken.mockResolvedValue({ uid: 'recipient', email: 'recipient@example.com', email_verified: false });
    const result = await POST(request());
    expect(result.status).toBe(401);
    expect(mocks.queryGet).not.toHaveBeenCalled();
    expect(mocks.directGet).not.toHaveBeenCalled();
  });

  it('does not enumerate another recipient\'s invitation', async () => {
    mocks.verifyIdToken.mockResolvedValue({ uid: 'attacker', email: 'attacker@example.com', email_verified: true });
    const result = await POST(request());
    expect(result.status).toBe(404);
    expect(JSON.stringify(await result.json())).not.toContain('recipient@example.com');
  });

  it('rejects malformed codes before querying Firestore', async () => {
    expect((await POST(request('x'))).status).toBe(400);
    expect(mocks.queryGet).not.toHaveBeenCalled();
  });

  it('returns a minimally scoped invite without code or internal notes', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const data = await response.json();
    expect(data.invite.expiresAtMs).toBe(1900000000000);
    expect(data.invite.role).toBe('member');
    expect(JSON.stringify(data)).not.toContain(validCode);
    expect(JSON.stringify(data)).not.toContain('Never return this');
  });

  it('preserves existing document ID links', async () => {
    mocks.queryGet.mockResolvedValue({ docs: [] });
    mocks.directGet.mockResolvedValue({ id: 'legacy-doc-1234', exists: true, data: () => invite });
    const result = await POST(request('legacy-doc-1234'));
    expect(result.status).toBe(200);
    expect(mocks.directGet).toHaveBeenCalledWith('legacy-doc-1234');
  });
});
