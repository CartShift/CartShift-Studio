import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestore = vi.hoisted(() => ({
  writeBatch: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  runTransaction: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  doc: firestore.doc,
  writeBatch: firestore.writeBatch,
  onSnapshot: firestore.onSnapshot,
  query: firestore.query,
  where: firestore.where,
  runTransaction: firestore.runTransaction,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  increment: vi.fn((amount: number) => ({ increment: amount })),
  Timestamp: { now: vi.fn(() => new Date('2026-01-01T00:00:00Z')) },
}));

vi.mock('@/lib/firebase', () => ({
  getFirestoreDb: vi.fn(() => ({ name: 'db' })),
  getFirebaseAuth: vi.fn(() => ({ currentUser: { uid: 'agent-a' } })),
  waitForAuth: vi.fn().mockResolvedValue(undefined),
}));

import { createComment, deleteComment, subscribeToRequestComments } from '@/lib/services/portal-comments';

describe('private agency comments', () => {
  const set = vi.fn();
  const update = vi.fn();
  const commit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    firestore.doc.mockImplementation((collection: { name?: string }, name?: string, id?: string) => ({
      name: name ?? collection.name,
      id: id ?? 'comment-1',
    }));
    firestore.writeBatch.mockReturnValue({ set, update, commit });
    commit.mockResolvedValue(undefined);
  });

  it('atomically increments request count without exposing internal text in lastComment', async () => {
    await createComment('request-a', 'org-a', 'agent-a', 'Agency', undefined, {
      content: 'Internal cost breakdown',
      isInternal: true,
    });

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'comment-1' }),
      expect.objectContaining({ isInternal: true, content: 'Internal cost breakdown' }),
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'request-a' }),
      expect.objectContaining({ commentCount: { increment: 1 } }),
    );
    expect(update.mock.calls.every(([, values]) => !('lastComment' in values))).toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('writes client-visible preview in the same atomic batch for public comments', async () => {
    await createComment('request-a', 'org-a', 'client-a', 'Client', undefined, {
      content: 'Please review this layout',
      isInternal: false,
    });

    expect(update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lastComment: expect.objectContaining({ content: 'Please review this layout' }),
      }),
    );
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it('does not finish creating a comment when the atomic batch fails', async () => {
    commit.mockRejectedValueOnce({ code: 'permission-denied' });
    await expect(createComment('request-a', 'org-a', 'client-a', 'Client', undefined, {
      content: 'Will not persist',
      isInternal: false,
    })).rejects.toThrow(/permission/i);
    expect(set).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('deletes a comment and decrements its counter in one transaction', async () => {
    const tx = { get: vi.fn().mockResolvedValue({
      exists: () => true,
      data: () => ({ requestId: 'request-a' }),
    }), delete: vi.fn(), update: vi.fn() };
    firestore.runTransaction.mockImplementation(async (_db: unknown, perform: (transaction: typeof tx) => Promise<void>) =>
      perform(tx)
    );

    await deleteComment('comment-a');
    expect(tx.delete).toHaveBeenCalledWith(expect.objectContaining({ id: 'comment-a' }));
    expect(tx.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'request-a' }),
      expect.objectContaining({ commentCount: { increment: -1 } }),
    );
  });

  it('does not decrement a counter when a comment has already been removed', async () => {
    const tx = { get: vi.fn().mockResolvedValue({ exists: () => false }), delete: vi.fn(), update: vi.fn() };
    firestore.runTransaction.mockImplementation(async (_db: unknown, perform: (transaction: typeof tx) => Promise<void>) =>
      perform(tx)
    );
    await expect(deleteComment('comment-a')).rejects.toThrow('Comment not found');
    expect(tx.delete).not.toHaveBeenCalled();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it('constrains client realtime listeners in the Firestore query itself', () => {
    firestore.where.mockImplementation((field: string, op: string, value: unknown) => ({ field, op, value }));
    firestore.onSnapshot.mockReturnValue(vi.fn());
    subscribeToRequestComments('request-a', () => {}, false, 'org-a');
    return vi.waitFor(() => {
      expect(firestore.query).toHaveBeenCalledWith(
        expect.anything(),
        { field: 'requestId', op: '==', value: 'request-a' },
        { field: 'orgId', op: '==', value: 'org-a' },
        { field: 'isInternal', op: '==', value: false },
      );
    });
  });
});
