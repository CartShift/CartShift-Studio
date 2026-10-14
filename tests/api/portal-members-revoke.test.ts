import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(), get: vi.fn(), update: vi.fn(), runTransaction: vi.fn(),
}));
vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: mocks.session }));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-now',
    arrayRemove: (value: string) => ({ remove: value }),
  },
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (collection: string) => ({
      doc: (id: string) => ({ path: `${collection}/${id}` }),
    }),
    runTransaction: (...args: unknown[]) => mocks.runTransaction(...args),
  },
}));

import { POST } from '@/app/api/portal/members/revoke/route';

const request = (body: unknown = {
  memberId: 'orgA_clientB', orgId: 'orgA', userId: 'clientB',
}, origin?: string) => new NextRequest(
  'https://portal.cart-shift.com/api/portal/members/revoke',
  { method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  }
);

const store = new Map<string, { exists: boolean; data: () => Record<string, unknown> | undefined }>();
const row = (data: Record<string, unknown> | undefined) => ({
  exists: Boolean(data), data: () => data,
});
describe('atomic portal membership revocation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    store.clear();
    mocks.session.mockResolvedValue({ uid: 'managerA' });
    store.set('portal_users/managerA', row({ accountType: 'AGENCY', agencyRole: 'admin' }));
    store.set('portal_organizations/orgA', row({ createdBy: 'other' }));
    store.set('portal_members/orgA_managerA', row(undefined));
    store.set('portal_members/orgA_clientB', row({
      orgId: 'orgA', userId: 'clientB', role: 'member',
    }));
    store.set('portal_users/clientB', row({ organizations: ['orgA', 'orgB'] }));
    mocks.get.mockImplementation(async (ref: { path: string }) => store.get(ref.path) ?? row(undefined));
    mocks.runTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ get: mocks.get, update: mocks.update }));
  });

  it('rejects unauthenticated or wrong-origin operations without starting a transaction', async () => {
    mocks.session.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    mocks.session.mockResolvedValue({ uid: 'managerA' });
    expect((await POST(request(undefined, 'https://malicious.example'))).status).toBe(403);
    expect(mocks.runTransaction).not.toHaveBeenCalled();
  });

  it('cannot revoke a membership belonging to a different org or target', async () => {
    const result = await POST(request({ memberId: 'orgB_clientB', orgId: 'orgB', userId: 'clientB' }));
    expect(result.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
    expect((await POST(request({ memberId: 'orgA_someone', orgId: 'orgA', userId: 'clientB' }))).status).toBe(400);
  });

  it('rejects viewer and inactive agency accounts even when signed in', async () => {
    store.set('portal_users/managerA', row({ accountType: 'AGENCY', agencyRole: 'viewer' }));
    expect((await POST(request())).status).toBe(403);
    store.set('portal_users/managerA', row({
      accountType: 'AGENCY', agencyRole: 'owner', status: 'suspended',
    }));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('updates membership revocation and the account org list in one transaction', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect((await response.json()).revoked).toBe(true);
    expect(mocks.runTransaction).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(
      { path: 'portal_members/orgA_clientB' }, { removedAt: 'server-now' }
    );
    expect(mocks.update).toHaveBeenCalledWith(
      { path: 'portal_users/clientB' },
      { organizations: { remove: 'orgA' }, updatedAt: 'server-now' }
    );
  });

  it('allows an active client organization admin but not an unrelated client', async () => {
    store.set('portal_users/managerA', row({ accountType: 'CLIENT' }));
    expect((await POST(request())).status).toBe(403);
    store.set('portal_members/orgA_managerA', row({
      orgId: 'orgA', userId: 'managerA', role: 'admin',
    }));
    expect((await POST(request())).status).toBe(200);
  });

  it('does not treat a revoked organization creator as an active admin', async () => {
    store.set('portal_users/managerA', row({ accountType: 'CLIENT' }));
    store.set('portal_organizations/orgA', row({ createdBy: 'managerA' }));
    store.set('portal_members/orgA_managerA', row({
      orgId: 'orgA', userId: 'managerA', role: 'owner', removedAt: true,
    }));
    expect((await POST(request())).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('is idempotent for a removed member but still reconciles cached organizations', async () => {
    store.set('portal_members/orgA_clientB', row({
      orgId: 'orgA', userId: 'clientB', removedAt: true,
    }));
    expect((await POST(request())).status).toBe(200);
    expect(mocks.update).not.toHaveBeenCalledWith(
      { path: 'portal_members/orgA_clientB' }, expect.anything()
    );
    expect(mocks.update).toHaveBeenCalledWith(
      { path: 'portal_users/clientB' }, expect.anything()
    );
  });
});
