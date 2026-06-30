import { describe, expect, it } from 'vitest';
import {
  createTimestampLike,
  isTimestampLike,
  rehydratePortalTimestamps,
} from '@/lib/utils/timestamp-like';
import { serializeFirestoreValue } from '@/lib/server/portal-serialize';

describe('timestamp-like', () => {
  it('creates values compatible with toDate()', () => {
    const timestamp = createTimestampLike(1_704_067_200_000);
    expect(timestamp.toDate()).toEqual(new Date(1_704_067_200_000));
    expect(timestamp.toMillis()).toBe(1_704_067_200_000);
    expect(isTimestampLike(timestamp)).toBe(true);
  });

  it('rehydrates plain serializable timestamps', () => {
    const restored = rehydratePortalTimestamps({
      createdAt: { seconds: 1_704_067_200, nanoseconds: 0 },
    }) as { createdAt: ReturnType<typeof createTimestampLike> };

    expect(restored.createdAt.toMillis()).toBe(1_704_067_200_000);
    expect(isTimestampLike(restored.createdAt)).toBe(true);
  });
});

describe('portal-serialize', () => {
  it('serializes admin timestamps recursively as JSON-safe values', () => {
    const serialized = serializeFirestoreValue({
      createdAt: {
        toMillis: () => 1_704_067_200_000,
      },
      nested: [{ updatedAt: { toMillis: () => 1_704_067_300_000 } }],
    }) as {
      createdAt: { seconds: number; nanoseconds: number };
      nested: Array<{ updatedAt: { seconds: number; nanoseconds: number } }>;
    };

    expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);
    expect(serialized.createdAt.seconds).toBe(1_704_067_200);
    expect(serialized.nested[0].updatedAt.seconds).toBe(1_704_067_300);

    const restored = rehydratePortalTimestamps(serialized) as {
      createdAt: ReturnType<typeof createTimestampLike>;
      nested: Array<{ updatedAt: ReturnType<typeof createTimestampLike> }>;
    };

    expect(restored.createdAt.toDate()).toEqual(new Date(1_704_067_200_000));
    expect(restored.nested[0].updatedAt.toMillis()).toBe(1_704_067_300_000);
  });
});
