import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestore = vi.hoisted(() => ({
  doc: vi.fn(),
  writeBatch: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: { now: () => new Date('2026-01-01T00:00:00.000Z') },
  collection: vi.fn((_db, name: string) => ({ name })),
  doc: firestore.doc,
  writeBatch: firestore.writeBatch,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  addDoc: vi.fn(), updateDoc: vi.fn(), deleteDoc: vi.fn(),
  getDoc: firestore.getDoc, getDocs: vi.fn(), query: vi.fn(), where: vi.fn(),
  orderBy: vi.fn(), limit: vi.fn(), onSnapshot: vi.fn(),
  increment: vi.fn(), arrayUnion: vi.fn(), arrayRemove: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getFirebaseAuth: vi.fn(),
  getFirestoreDb: vi.fn(() => ({ name: 'db' })),
  waitForAuth: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/services/portal-activities', () => ({ logActivity: vi.fn() }));
vi.mock('@/lib/services/portal-users', () => ({ getPortalUser: vi.fn() }));
vi.mock('@/lib/services/auth', () => ({ isLoggingOut: vi.fn(() => false) }));

import { getFirebaseAuth } from '@/lib/firebase';
import { getPortalUser } from '@/lib/services/portal-users';

import { createRequest, createRequestForClient } from '@/lib/services/portal-requests';

describe('atomic request creation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let index = 0;
    firestore.doc.mockImplementation((...args: unknown[]) => ({ id: args.length === 3 ? args[2] : `doc-${++index}` }));
  });

  it('commits request and audit activity in a single write batch', async () => {
    const set = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);
    firestore.writeBatch.mockReturnValue({ set, commit });

    const request = await createRequest('org-a', 'user-a', 'Alice', {
      title: 'Fix theme',
      description: 'Description',
      type: 'bug',
      priority: 'NORMAL',
    });

    expect(request.id).toBe('doc-1');
    expect(commit).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenCalledWith(
      { id: 'doc-2' },
      expect.objectContaining({
        requestId: 'doc-1',
        action: 'CREATED_REQUEST',
        userId: 'user-a',
      })
    );
  });

  it('creates a new batch on retry but keeps request and activity IDs stable', async () => {
    const sets = [vi.fn(), vi.fn()];
    firestore.writeBatch
      .mockReturnValueOnce({ set: sets[0], commit: vi.fn().mockRejectedValue({ code: 'unavailable' }) })
      .mockReturnValueOnce({ set: sets[1], commit: vi.fn().mockResolvedValue(undefined) });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = await createRequestForClient('org-a', 'user-a', 'Alice', ' CLIENT@example.com ', {
        title: 'New request',
        description: 'Description',
        type: 'feature',
        priority: 'NORMAL',
      });
      expect(result.id).toBe('doc-1');
      expect(firestore.doc.mock.calls.filter(args => args.length === 1)).toHaveLength(2);
      expect(firestore.writeBatch).toHaveBeenCalledTimes(2);
      expect(sets[0].mock.calls[0][0]).toEqual(sets[1].mock.calls[0][0]);
      expect(sets[0].mock.calls[1][0]).toEqual(sets[1].mock.calls[1][0]);
      expect(sets[1].mock.calls[0][1]).toEqual(expect.objectContaining({ clientEmail: 'client@example.com' }));
    } finally {
      warn.mockRestore();
    }
  });

  it('recognizes a committed request after its write acknowledgement is lost', async () => {
    vi.mocked(getFirebaseAuth).mockReturnValue({ currentUser: { uid: 'user-a' } } as unknown as ReturnType<typeof getFirebaseAuth>);
    vi.mocked(getPortalUser).mockResolvedValue({ accountType: 'AGENCY' } as Awaited<ReturnType<typeof getPortalUser>>);
    let persisted = false;
    firestore.getDoc.mockImplementation(async (reference: { id: string }) => ({
      id: reference.id, exists: () => persisted,
      data: () => ({ orgId: 'org-a', createdBy: 'user-a' }),
    }));
    const set = vi.fn();
    const commit = vi.fn().mockImplementation(async () => {
      if (persisted) throw { code: 'permission-denied' };
      persisted = true;
      throw { code: 'deadline-exceeded' };
    });
    firestore.writeBatch.mockReturnValue({ set, commit });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = await createRequest('org-a', 'user-a', 'Alice', {
        title: 'Acknowledgement lost', description: 'Already committed', type: 'bug', priority: 'NORMAL',
      });
      expect(result.id).toBe('doc-1');
      expect(commit).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledTimes(2);
    } finally { warn.mockRestore(); }
  });
});
