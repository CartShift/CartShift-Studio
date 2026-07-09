import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { isTimestampLike } from '@/lib/utils/timestamp-like';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Recursively removes undefined values from an object.
 * Useful for Firestore updates where undefined is not allowed.
 * Preserves special objects like Dates and Firestore Timestamps.
 */
export function deepClean<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj as unknown as T;
  }

  if (
    isTimestampLike(obj) ||
    (typeof obj === 'object' &&
      obj !== null &&
      (obj as { constructor?: { name?: string } }).constructor?.name === 'Timestamp')
  ) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClean(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  Object.keys(obj as object).forEach(key => {
    const value = (obj as Record<string, unknown>)[key];
    if (value !== undefined) {
      result[key] = deepClean(value);
    }
  });

  return result as T;
}
