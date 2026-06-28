import { describe, expect, it } from 'vitest';
import { createTimestampLike, isTimestampLike } from '@/lib/utils/timestamp-like';
import { serializeFirestoreValue } from '@/lib/server/portal-serialize';

describe('timestamp-like', () => {
  it('creates values compatible with toDate()', () => {
    const timestamp = createTimestampLike(1_704_067_200_000);
    expect(timestamp.toDate()).toEqual(new Date(1_704_067_200_000));
    expect(timestamp.toMillis()).toBe(1_704_067_200_000);
    expect(isTimestampLike(timestamp)).toBe(true);
  });
});

describe('portal-serialize', () => {
  it('serializes admin timestamps recursively', () => {
    const serialized = serializeFirestoreValue({
      createdAt: {
        toMillis: () => 1_704_067_200_000,
      },
      nested: [{ updatedAt: { toMillis: () => 1_704_067_300_000 } }],
    }) as {
      createdAt: ReturnType<typeof createTimestampLike>;
      nested: Array<{ updatedAt: ReturnType<typeof createTimestampLike> }>;
    };

    expect(serialized.createdAt.toDate()).toEqual(new Date(1_704_067_200_000));
    expect(serialized.nested[0].updatedAt.toMillis()).toBe(1_704_067_300_000);
  });
});
