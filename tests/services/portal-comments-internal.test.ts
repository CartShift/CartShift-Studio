import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_db: unknown, name: string) => ({ name })),
  doc: vi.fn((_db: unknown, name: string, id: string) => ({ name, id })),
  addDoc: firestore.addDoc,
  updateDoc: firestore.updateDoc,
  serverTimestamp: vi.fn(() => 'server-timestamp'),
  increment: vi.fn((amount: number) => ({ increment: amount })),
  Timestamp: { now: vi.fn(() => new Date('2026-01-01T00:00:00Z')) },
}));

vi.mock('@/lib/firebase', () => ({
  getFirestoreDb: vi.fn(() => ({ name: 'db' })),
  waitForAuth: vi.fn().mockResolvedValue(undefined),
}));

import { createComment } from '@/lib/services/portal-comments';

describe('private agency comment previews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestore.addDoc.mockResolvedValue({ id: 'comment-1' });
    firestore.updateDoc.mockResolvedValue(undefined);
  });

  it('increments the request count without publishing private text in lastComment', async () => {
    await createComment('request-a', 'org-a', 'agent-a', 'Agency', undefined, {
      content: 'Internal cost breakdown',
      isInternal: true,
    });

    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ commentCount: { increment: 1 } })
    );
    expect(firestore.updateDoc.mock.calls.every(([, update]) => !('lastComment' in update))).toBe(true);
  });

  it('keeps public comment previews visible to the client', async () => {
    await createComment('request-a', 'org-a', 'client-a', 'Client', undefined, {
      content: 'Please review this layout',
      isInternal: false,
    });

    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        lastComment: expect.objectContaining({ content: 'Please review this layout' }),
      })
    );
  });
});
