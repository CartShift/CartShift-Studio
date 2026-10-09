import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  document: vi.fn(),
  comments: vi.fn(),
}));

vi.mock('@/lib/auth/server-auth', () => ({
  getServerSession: mocks.session,
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => {
      const query = {
        where: () => query,
        limit: () => query,
        get: () => mocks.comments(),
        doc: (id: string) => ({ get: () => mocks.document(name, id) }),
      };
      return query;
    },
  },
}));

import { GET } from '@/app/api/portal/public-comments/route';

const request = (org = 'organization123') => new NextRequest(
  'https://portal.cart-shift.com/api/portal/public-comments?request_id=request123&org_id=' + org
);

describe('public-only portal comment API', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.session.mockResolvedValue({ uid: 'client123', email: 'client@example.com' });
    mocks.document.mockImplementation((name: string) => {
      const value = name === 'portal_users'
        ? { accountType: 'CLIENT', isAgency: false, status: 'active' }
        : name === 'portal_requests'
          ? { orgId: 'organization123' }
          : name === 'portal_organizations'
            ? { name: 'Client Store' }
            : name === 'portal_members'
              ? { orgId: 'organization123', userId: 'client123' }
              : null;
      return Promise.resolve({ exists: Boolean(value), data: () => value });
    });
    mocks.comments.mockResolvedValue({
      size: 2,
      docs: [
        { id: 'public', data: () => ({ orgId: 'organization123', requestId: 'request123',
          isInternal: false, content: 'Approved for client', createdAt: { toMillis: () => 17000 } }) },
        { id: 'internal', data: () => ({ orgId: 'organization123', requestId: 'request123',
          isInternal: true, content: 'Agency private note', createdAt: { toMillis: () => 18000 } }) },
      ],
    });
  });

  it('challenges anonymous traffic', async () => {
    mocks.session.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mocks.comments).not.toHaveBeenCalled();
  });

  it('rejects organization mismatches without querying comments', async () => {
    const response = await GET(request('different_org123'));
    expect(response.status).toBe(404);
    expect(mocks.comments).not.toHaveBeenCalled();
  });

  it('rejects users without a valid membership or creator role', async () => {
    mocks.document.mockImplementation((name: string) => {
      const value = name === 'portal_users' ? { accountType: 'CLIENT' }
        : name === 'portal_requests' ? { orgId: 'organization123' }
          : name === 'portal_organizations' ? { createdBy: 'someone_else' } : null;
      return Promise.resolve({ exists: Boolean(value), data: () => value });
    });
    const response = await GET(request());
    expect(response.status).toBe(403);
    expect(mocks.comments).not.toHaveBeenCalled();
  });

  it('redacts internal comments even when the backend query unexpectedly returns them', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const result = await response.json();
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0].id).toBe('public');
    expect(JSON.stringify(result)).not.toContain('Agency private note');
    expect(result.comments[0].createdAtMs).toBe(17000);
  });
});
