export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

/** Plain JSON-safe timestamp for Server Component → Client Component transfer */
export interface SerializableTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function createTimestampLike(millis: number): TimestampLike {
  const seconds = Math.floor(millis / 1000);
  const nanoseconds = (millis % 1000) * 1_000_000;

  return {
    seconds,
    nanoseconds,
    toDate: () => new Date(millis),
    toMillis: () => millis,
  };
}

export function createSerializableTimestamp(millis: number): SerializableTimestamp {
  const seconds = Math.floor(millis / 1000);
  const nanoseconds = (millis % 1000) * 1_000_000;
  return { seconds, nanoseconds };
}

export function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as TimestampLike).toDate === 'function'
  );
}

export function isSerializableTimestamp(value: unknown): value is SerializableTimestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as SerializableTimestamp).seconds === 'number' &&
    typeof (value as SerializableTimestamp).nanoseconds === 'number' &&
    !('toDate' in value)
  );
}

export function rehydratePortalTimestamps<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (isSerializableTimestamp(value)) {
    const millis = value.seconds * 1000 + Math.floor(value.nanoseconds / 1_000_000);
    return createTimestampLike(millis) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => rehydratePortalTimestamps(item)) as T;
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        rehydratePortalTimestamps(nestedValue),
      ])
    ) as T;
  }

  return value;
}
