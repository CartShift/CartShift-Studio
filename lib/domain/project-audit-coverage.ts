/**
 * Bounded audits cannot treat an unseen reference as missing when the target
 * collection may have more documents than the configured scan limit.
 */
export type AuditReference<T> =
  | { status: 'found'; value: T }
  | { status: 'missing' }
  | { status: 'unverified' };

export function resolveAuditReference<T>(
  targetId: string,
  scanned: ReadonlyMap<string, T>,
  scanComplete: boolean,
): AuditReference<T> {
  if (scanned.has(targetId)) {
    return { status: 'found', value: scanned.get(targetId) as T };
  }
  return scanComplete ? { status: 'missing' } : { status: 'unverified' };
}
