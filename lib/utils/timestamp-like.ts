export interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
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

export function isTimestampLike(value: unknown): value is TimestampLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as TimestampLike).toDate === 'function'
  );
}
