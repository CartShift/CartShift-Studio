import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(), actorGet: vi.fn(), projectGet: vi.fn(),
  listGet: vi.fn(), add: vi.fn(), runTransaction: vi.fn(), recordGet: vi.fn(),
  recordUpdate: vi.fn(),
}));
vi.mock('@/lib/auth/server-auth', () => ({ getServerSession: mocks.session }));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        id, get: name === 'portal_users' ? mocks.actorGet : mocks.projectGet,
        collection: () => ({
          orderBy: () => ({ limit: () => ({ get: mocks.listGet }) }),
          add: mocks.add,
          doc: (recordId: string) => ({ id: recordId }),
        }),
      }),
    }),
    runTransaction: mocks.runTransaction,
  },
}));
import { GET, POST, PATCH } from '@/app/api/portal/projects/[projectId]/private-records/route';

const context = { params: Promise.resolve({ projectId: 'project_arava_123' }) };
const request = (method: string, data?: unknown, origin?: string) =>
  new NextRequest('https://portal.example.com/api/portal/projects/project_arava_123/private-records', {
    method, headers: { ...(data !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(origin ? { origin } : {}) }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });

describe('internal project operations server authorization', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ uid: 'staff-123' });
    mocks.actorGet.mockResolvedValue({ exists: true,
      data: () => ({ isAgency: true, accountType: 'AGENCY', status: 'active' }) });
    mocks.projectGet.mockResolvedValue({ exists: true, data: () => ({ orgId: 'arava_org' }) });
    mocks.listGet.mockResolvedValue({ docs: [{ id: 'qa-record', data: () => ({
      kind: 'qa', title: 'Test', details: '', status: 'open',
      createdAt: { toMillis: () => 1234 },
    }) }] });
    mocks.add.mockResolvedValue({ id: 'created-record' });
  });
  it('does not reveal agency records to an unauthenticated visitor', async () => {
    mocks.session.mockResolvedValue(null);
    const res = await GET(request('GET'), context);
    expect(res.status).toBe(401);
    expect(mocks.listGet).not.toHaveBeenCalled();
  });
  it('does not reveal internal records to an authenticated client with access to the project', async () => {
    mocks.actorGet.mockResolvedValue({ exists: true, data: () => ({ accountType: 'CLIENT' }) });
    const res = await GET(request('GET'), context);
    expect(res.status).toBe(403);
    expect(mocks.listGet).not.toHaveBeenCalled();
  });
  it('rejects writes from foreign origins', async () => {
    const res = await POST(request('POST', { title: 'Tampered' }, 'https://evil.example'), context);
    expect(res.status).toBe(403);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it('does not expose records for a nonexistent project', async () => {
    mocks.projectGet.mockResolvedValue({ exists: false });
    const res = await GET(request('GET'), context);
    expect(res.status).toBe(404);
  });
  it('allows viewer to read internal evidence but prevents editing it', async () => {
    mocks.actorGet.mockResolvedValue({ exists: true,
      data: () => ({ accountType: 'AGENCY', agencyRole: 'viewer', status: 'active' }) });
    expect((await GET(request('GET'), context)).status).toBe(200);
    expect((await POST(request('POST', { kind: 'qa', title: 'Should not save', details: '' }), context)).status).toBe(403);
    expect((await PATCH(request('PATCH', { recordId: 'qa-record', status: 'passed' }), context)).status).toBe(403);
    expect(mocks.add).not.toHaveBeenCalled();
    expect(mocks.runTransaction).not.toHaveBeenCalled();
  });
  it('lists bounded, sanitized evidence for agency staff', async () => {
    const res = await GET(request('GET'), context);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items[0]).toMatchObject({ id: 'qa-record', createdAtMs: 1234 });
    expect(mocks.listGet).toHaveBeenCalledOnce();
  });
  it('creates evidence with agency authorship, never with client-supplied status', async () => {
    const res = await POST(request('POST', {
      kind: 'decision', title: 'Approved source data', details: 'Vered confirmed',
      status: 'confirmed',
    }), context);
    expect(res.status).toBe(400);
    expect(mocks.add).not.toHaveBeenCalled();
    const valid = await POST(request('POST', {
      kind: 'decision', title: 'Approved source data', details: 'Vered confirmed',
    }), context);
    expect(valid.status).toBe(201);
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({
      createdBy: 'staff-123', status: 'open', kind: 'decision',
    }));
  });
  it('refuses client writes even when origin is valid', async () => {
    mocks.actorGet.mockResolvedValue({ exists: true, data: () => ({ accountType: 'CLIENT' }) });
    const res = await PATCH(request('PATCH', { recordId: 'qa-record', status: 'passed' }), context);
    expect(res.status).toBe(403);
    expect(mocks.runTransaction).not.toHaveBeenCalled();
  });
});
