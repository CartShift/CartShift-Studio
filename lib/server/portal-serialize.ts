import 'server-only';

import type { DocumentData } from 'firebase-admin/firestore';
import { createTimestampLike } from '@/lib/utils/timestamp-like';

function isAdminTimestamp(value: unknown): value is { toMillis: () => number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  );
}

export function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (isAdminTimestamp(value)) {
    return createTimestampLike(value.toMillis());
  }

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        serializeFirestoreValue(nestedValue),
      ])
    );
  }

  return value;
}

export function serializeFirestoreDoc<T extends { id: string }>(
  id: string,
  data: DocumentData | undefined
): T | null {
  if (!data) {
    return null;
  }

  return {
    id,
    ...(serializeFirestoreValue(data) as Record<string, unknown>),
  } as T;
}
