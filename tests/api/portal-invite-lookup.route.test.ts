import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  getUser: vi.fn(),
  listInvites: vi.fn(),
  getInvite: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: mocks.verifyToken },
  adminDb: {
    collection: (name: string) => name === 'portal_users'
      ? { doc: () => ({ get: mocks.getUser }) }
      : {
          where: () => ({ limit: () => ({ get: mocks.listInvites }) }),
          doc: () => ({ get: mocks.getInvite }),
        },
  },
}));

import { GET } from '@/app/api/portal/invite/lookup/route';

const code = 'a35dc8c57839c69ce813d3cb';
function req(token?: string, value = code) {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new NextRequest(`https://cartshift.test/api/portal/invite/lookup?code=${value}`, { headers });
}
const invite = {
  id: 'invite-1',
  data: () => ({
    orgId: 'orgA', code, email: 'member@example.com', role: 'member',
    invitedBy: 'agency', status: 'pending', isAgency: false,
    createdAt: { toMillis: () => 1_000 },
    expiresAt: { toMillis: () => 9_000 },
  }),
};

describe('authenticated invitation lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyToken.mockResolvedValue({ uid: 'client', email: 'member@example.com' });
    mocks.getUser.mockResolvedValue({ data: () => ({ accountType: 'CLIENT' }) });
    mocks.listInvites.mockResolvedValue({ docs: [invite] });
    mocks.getInvite.mockResolvedValue({ exists: false });
  });

  it('requires a valid authenticated Firebase identity', async () => {
    expect((await GET(req())).status).toBe(401);
    mocks.verifyToken.mockRejectedValue(new Error('invalid Firebase token'));
    expect((await GET(req('invalid'))).status).toBe(401);
  });

  it('rejects invalid codes before document lookup', async () => {
    const response = await GET(req('valid', '..'));
    expect(response.status).toBe(400);
    expect(mocks.listInvites).not.toHaveBeenCalled();
  });

  it('does not reveal invite contents to another email identity', async () => {
    mocks.verifyToken.mockResolvedValue({ uid: 'stranger', email: 'stranger@example.com' });
    const response = await GET(req('valid'));
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('member@example.com');
  });

  it('returns invite metadata to the invited authenticated recipient', async () => {
    const response = await GET(req('valid'));
    expect(response.status).toBe(200);
    expect((await response.json()).invite).toMatchObject({
      id: 'invite-1', orgId: 'orgA', email: 'member@example.com',
      createdAtMillis: 1_000, expiresAtMillis: 9_000,
    });
  });

  it('permits authorized agency staff to look up organization invitations', async () => {
    mocks.verifyToken.mockResolvedValue({ uid: 'staff', email: 'staff@example.com' });
    mocks.getUser.mockResolvedValue({ data: () => ({ accountType: 'AGENCY', isAgency: true }) });
    expect((await GET(req('valid'))).status).toBe(200);
  });
});
