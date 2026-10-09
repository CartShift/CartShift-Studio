import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  snapshots: {} as Record<string, { exists: boolean; data: () => Record<string, unknown> }>,
  updates: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: () => 'server-stamp',
      arrayRemove: (value: string) => ({ remove: value }),
    },
  },
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminAuth: { verifyIdToken: mocks.verifyToken },
  adminDb: {
    collection: (name: string) => ({ doc: (id: string) => ({ path: `${name}/${id}` }) }),
    runTransaction: mocks.transaction,
  },
}));

import { POST } from '@/app/api/portal/members/remove/route';

function request(memberId = 'orgA_client', orgId = 'orgA', userId = 'client', token = 'valid') {
  return new NextRequest('https://cartshift.test/api/portal/members/remove', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ memberId, orgId, userId }),
  });
}

describe('atomic organization member removal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyToken.mockResolvedValue({ uid: 'agency' });
    mocks.snapshots = {
      'portal_members/orgA_client': { exists: true, data: () => ({ orgId: 'orgA', userId: 'client', role: 'member' }) },
      'portal_members/orgA_agency': { exists: false, data: () => ({}) },
      'portal_users/agency': { exists: true, data: () => ({ accountType: 'AGENCY', agencyRole: 'admin' }) },
      'portal_users/client': { exists: true, data: () => ({ organizations: ['orgA'] }) },
      'portal_organizations/orgA': { exists: true, data: () => ({ createdBy: 'agency' }) },
    };
    mocks.transaction.mockImplementation(async (run: (tx: {
      get: (ref: { path: string }) => Promise<unknown>;
      update: (ref: { path: string }, value: unknown) => void;
    }) => Promise<unknown>) => run({
      get: async (ref: { path: string }) => mocks.snapshots[ref.path] ?? { exists: false, data: () => ({}) },
      update: (ref: { path: string }, value: unknown) => mocks.updates(ref.path, value),
    }));
  });

  it('rejects an unauthenticated or forged token', async () => {
    mocks.verifyToken.mockRejectedValue(new Error('invalid signature'));
    expect((await POST(request())).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('requires the submitted membership ID to match the org and user', async () => {
    expect((await POST(request('orgB_client'))).status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('does not allow unauthorized clients to remove organization members', async () => {
    mocks.verifyToken.mockResolvedValue({ uid: 'outsider' });
    mocks.snapshots['portal_users/outsider'] = {
      exists: true, data: () => ({ accountType: 'CLIENT', isAgency: false }),
    };
    const response = await POST(request());
    expect(response.status).toBe(403);
    expect(mocks.updates).not.toHaveBeenCalled();
  });

  it('changes membership and profile associations in the same transaction', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.updates).toHaveBeenCalledWith('portal_members/orgA_client', {
      removedAt: 'server-stamp',
    });
    expect(mocks.updates).toHaveBeenCalledWith('portal_users/client', {
      organizations: { remove: 'orgA' },
      updatedAt: 'server-stamp',
    });
  });

  it('does not issue writes for an already removed member', async () => {
    mocks.snapshots['portal_members/orgA_client'] = {
      exists: true, data: () => ({ orgId: 'orgA', userId: 'client', removedAt: 'old-stamp' }),
    };
    expect((await POST(request())).status).toBe(200);
    expect(mocks.updates).not.toHaveBeenCalled();
  });
});
