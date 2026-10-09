import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  uid: 'client-user',
  orgGet: vi.fn(),
  userGet: vi.fn(),
  requestGet: vi.fn(),
  memberGet: vi.fn(),
  commentsGet: vi.fn(),
  queries: [] as Array<[string, string, unknown]>,
}));

vi.mock('@/lib/auth/server-auth', () => ({
  getServerSession: vi.fn(async () => state.uid ? { uid: state.uid } : null),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: () => ({
        get: name === 'portal_users' ? state.userGet :
          name === 'portal_requests' ? state.requestGet :
            name === 'portal_organizations' ? state.orgGet : state.memberGet,
      }),
      where: (field: string, operator: string, value: unknown) => {
        state.queries.push([field, operator, value]);
        const chain = {
          where: (nextField: string, nextOperator: string, nextValue: unknown) => {
            state.queries.push([nextField, nextOperator, nextValue]);
            return chain;
          },
          limit: (_n: number) => ({ get: state.commentsGet }),
        };
        return chain;
      },
    }),
  },
}));

import { GET } from '@/app/api/portal/public-comments/route';

const url = new URL('https://portal.cart-shift.com/api/portal/public-comments?request_id=client_request&org_id=client_org');
const request = { nextUrl: url } as Parameters<typeof GET>[0];

describe('Public comments API privacy boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    state.queries.length = 0;
    state.uid = 'client-user';
    state.userGet.mockResolvedValue({
      data: () => ({ accountType: 'CLIENT', isAgency: false }),
    });
    state.requestGet.mockResolvedValue({
      exists: true, data: () => ({ orgId: 'client_org' }),
    });
    state.orgGet.mockResolvedValue({
      exists: true, data: () => ({ createdBy: 'someone-else', status: 'active' }),
    });
    state.memberGet.mockResolvedValue({
      data: () => ({ orgId: 'client_org', userId: 'client-user', role: 'member' }),
    });
    state.commentsGet.mockResolvedValue({
      size: 2,
      docs: [{
        id: 'publicA',
        data: () => ({
          requestId: 'client_request', orgId: 'client_org', isInternal: false,
          content: 'Visible to client', userName: 'Client',
        }),
      }, {
        id: 'internalA',
        data: () => ({
          requestId: 'client_request', orgId: 'client_org', isInternal: true,
          content: 'Agency private', userName: 'Agency',
        }),
      }],
    });
  });

  it('requires an authenticated user', async () => {
    state.uid = '';
    const result = await GET(request);
    expect(result.status).toBe(401);
    expect(state.commentsGet).not.toHaveBeenCalled();
  });

  it('blocks non-members before any comments query', async () => {
    state.memberGet.mockResolvedValue({ data: () => null });
    const result = await GET(request);
    expect(result.status).toBe(403);
    expect(state.commentsGet).not.toHaveBeenCalled();
  });

  it('filters explicitly public comments in the query and response', async () => {
    const result = await GET(request);
    expect(result.status).toBe(200);
    expect(result.headers.get('cache-control')).toContain('no-store');
    expect(state.queries).toContainEqual(['isInternal', '==', false]);
    const data = await result.json();
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].id).toBe('publicA');
    expect(JSON.stringify(data)).not.toContain('Agency private');
  });

  it('rejects cross-organization IDs before reading comments', async () => {
    const otherOrg = { nextUrl: new URL(
      'https://portal.cart-shift.com/api/portal/public-comments?request_id=client_request&org_id=wrong_org'
    ) } as Parameters<typeof GET>[0];
    const result = await GET(otherOrg);
    expect(result.status).toBe(404);
    expect(state.commentsGet).not.toHaveBeenCalled();
  });

  it('does not mistake a suspended account for an authorized member', async () => {
    state.userGet.mockResolvedValue({
      data: () => ({ accountType: 'CLIENT', status: 'suspended' }),
    });
    const result = await GET(request);
    expect(result.status).toBe(404);
    expect(state.commentsGet).not.toHaveBeenCalled();
  });
});
