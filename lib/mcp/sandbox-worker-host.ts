import { timingSafeEqual } from 'node:crypto';

/**
 * Fail-closed active-host credential selection.
 * Defaults to the pre-existing Windows bearer until an explicit cutover.
 * This does NOT fence an already running command or replace the drained-handoff gate.
 */
export function authorizeActiveWorkerHost(
  header: string | null,
  environment: {
    SANDBOX_WORKER_TOKEN?: string;
    SANDBOX_MOBILE_WORKER_TOKEN?: string;
    SANDBOX_AUTH_WORKER_TOKEN?: string;
    SANDBOX_ACTIVE_WORKER_HOST?: string;
    SANDBOX_AUTH_WORKER_ENFORCE?: string;
    SANDBOX_PARALLEL_ENABLED?: string;
  },
): boolean {
  const mode = environment.SANDBOX_ACTIVE_WORKER_HOST || 'windows';
  if (mode !== 'windows' && mode !== 'mobile') return false;
  const windowsToken = environment.SANDBOX_WORKER_TOKEN ?? '';
  const token = mode === 'windows'
    ? windowsToken
    : environment.SANDBOX_MOBILE_WORKER_TOKEN ?? '';
  if (!token || token.length < 32 || !/^[A-Za-z0-9_-]+$/.test(token)) return false;
  if (mode === 'mobile') {
    // The build-only Android bearer must never be accepted by the auth-session
    // channel or share the existing Windows bearer identity.
    if (environment.SANDBOX_AUTH_WORKER_ENFORCE !== 'true' ||
        environment.SANDBOX_PARALLEL_ENABLED === 'true' ||
        windowsToken === token || environment.SANDBOX_AUTH_WORKER_TOKEN === token) return false;
  }
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(header ?? '');
  if (!match) return false;
  const supplied = Buffer.from(match[1]);
  const expected = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
