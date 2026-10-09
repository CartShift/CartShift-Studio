/**
 * Safe client-side diagnostics: intentionally contains no PII, arbitrary
 * exception messages, stacks, URLs or request bodies.
 */
export const ERROR_CATEGORIES = ['permission', 'transient', 'validation', 'unknown'] as const;
export type ErrorCategory = typeof ERROR_CATEGORIES[number];

export const SAFE_FIREBASE_CODES = [
  'permission-denied', 'unauthenticated', 'unavailable', 'deadline-exceeded',
  'aborted', 'resource-exhausted', 'invalid-argument', 'failed-precondition',
] as const;
export type SafeFirebaseCode = typeof SAFE_FIREBASE_CODES[number];

export type SafeErrorEvent = {
  event: 'portal.client_error';
  eventId: string;
  category: ErrorCategory;
  code: SafeFirebaseCode | 'unknown';
};

export function classifySafeError(error: unknown): Pick<SafeErrorEvent, 'category' | 'code'> {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return { code: 'unknown', category: 'unknown' };
  }
  const raw = String(error.code).replace(/^(firestore|auth)\//, '');
  const code: SafeErrorEvent['code'] = (SAFE_FIREBASE_CODES as readonly string[]).includes(raw)
    ? raw as SafeFirebaseCode
    : 'unknown';
  if (code === 'permission-denied' || code === 'unauthenticated') return { code, category: 'permission' };
  if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'aborted' || code === 'resource-exhausted') {
    return { code, category: 'transient' };
  }
  if (code === 'invalid-argument' || code === 'failed-precondition') {
    return { code, category: 'validation' };
  }
  return { code, category: 'unknown' };
}

export function createSafeErrorEvent(error: unknown): SafeErrorEvent {
  return {
    event: 'portal.client_error',
    eventId: crypto.randomUUID(),
    ...classifySafeError(error),
  };
}
