import { beforeEach, describe, expect, it, vi } from 'vitest';

const f = vi.hoisted(() => ({
  getDocs: vi.fn(), getCountFromServer: vi.fn(), where: vi.fn(), orderBy: vi.fn(), startAfter: vi.fn(),
  query: vi.fn(), limit: vi.fn(), docId: vi.fn(),
  getPortalUser: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  documentId: f.docId,
  getDocs: f.getDocs,
  getCountFromServer: f.getCountFromServer,
  where: f.where,
  orderBy: f.orderBy,
  startAfter: f.startAfter,
  query: f.query,
  limit: f.limit,
  Timestamp: class Timestamp {
    constructor(public seconds: number, public nanoseconds: number) {}
  },
}));
vi.mock('@/lib/firebase', () => ({
  getFirestoreDb: vi.fn(() => ({ collection: 'mock' })),
  getFirebaseAuth: vi.fn(() => ({ currentUser: { uid: 'staff' } })),
  waitForAuth: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/services/portal-users', () => ({ getPortalUser: f.getPortalUser }));

import { getPortalRequestPage, getPortalRequestCountStats, normalizeRequestPageSize, assertRequestCursor } from '@/lib/services/portal-request-pages';

describe('cursor paging of portal requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.getPortalUser.mockResolvedValue({ accountType: 'AGENCY' });
    f.query.mockImplementation((_c: unknown, ...args: unknown[]) => args);
    f.where.mockImplementation((...args: unknown[]) => args);
    f.limit.mockImplementation((count: number) => ({ max: count }));
    f.orderBy.mockImplementation((...args: unknown[]) => args);
    f.docId.mockReturnValue('__name__');
    f.startAfter.mockImplementation((...args: unknown[]) => args);
  });

  it('bounds page size and refuses invalid cursors', () => {
    expect(normalizeRequestPageSize()).toBe(30);
    expect(() => normalizeRequestPageSize(101)).toThrow('INVALID_PAGE_SIZE');
    expect(() => assertRequestCursor({ id: '../secret', seconds: 1, nanoseconds: 0 })).toThrow('INVALID_REQUEST_CURSOR');
  });

  it('fetches one lookahead record and emits a tie-safe timestamp/id cursor', async () => {
    // A real Firestore Timestamp is needed for the cursor check.
    const { Timestamp } = await import('firebase/firestore');
    const docs = ['a','b','c'].map(id => ({
      id, data: () => ({ title: id, createdAt: new Timestamp(100, 0) }),
    }));
    f.getDocs.mockResolvedValue({ docs });
    const page = await getPortalRequestPage({ orgId: 'org-a', pageSize: 2 });
    expect(page.items.map(row => row.id)).toEqual(['a', 'b']);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toEqual({ id: 'b', seconds: 100, nanoseconds: 0 });
    expect(f.limit).toHaveBeenCalledWith(3);
  });

  it('counts statuses with aggregate queries without downloading request documents', async () => {
    f.getCountFromServer
      .mockResolvedValueOnce({ data: () => ({ count: 17 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 6 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 2 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 5 }) });
    await expect(getPortalRequestCountStats('org-a')).resolves.toEqual({
      total: 17, active: 6, inReview: 2, completed: 5,
    });
    expect(f.getDocs).not.toHaveBeenCalled();
    expect(f.getCountFromServer).toHaveBeenCalledTimes(4);
  });

  it('refuses unscoped cross-tenant reads by clients', async () => {
    f.getPortalUser.mockResolvedValue({ accountType: 'CLIENT' });
    await expect(getPortalRequestPage({ pageSize: 10 })).rejects.toThrow('FORBIDDEN');
    expect(f.getDocs).not.toHaveBeenCalled();
  });
});
