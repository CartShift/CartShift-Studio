import { describe, expect, it } from 'vitest';
import { authorizeActiveWorkerHost as authorize } from '@/lib/mcp/sandbox-worker-host';

const windowsToken = 'W'.repeat(43);
const mobileToken = 'M'.repeat(43);

describe('sandbox active-host credential gate', () => {
  const configured = { SANDBOX_WORKER_TOKEN: windowsToken, SANDBOX_MOBILE_WORKER_TOKEN: mobileToken, SANDBOX_AUTH_WORKER_ENFORCE: 'true' };
  it('defaults to existing Windows bearer for backwards compatibility', () => {
    expect(authorize('Bearer ' + windowsToken, configured)).toBe(true);
    expect(authorize('Bearer ' + mobileToken, configured)).toBe(false);
  });
  it('accepts only the distinct mobile bearer after explicit mobile cutover', () => {
    const env = { ...configured, SANDBOX_ACTIVE_WORKER_HOST: 'mobile' };
    expect(authorize('Bearer ' + mobileToken, env)).toBe(true);
    expect(authorize('Bearer ' + windowsToken, env)).toBe(false);
    expect(authorize(null, env)).toBe(false);
  });
  it('fails closed on unset/reused mobile credential and missing auth enforcement', () => {
    expect(authorize('Bearer ' + mobileToken, { ...configured, SANDBOX_ACTIVE_WORKER_HOST: 'mobile', SANDBOX_AUTH_WORKER_ENFORCE: 'false' })).toBe(false);
    expect(authorize('Bearer ' + windowsToken, { ...configured, SANDBOX_ACTIVE_WORKER_HOST: 'mobile', SANDBOX_MOBILE_WORKER_TOKEN: windowsToken })).toBe(false);
    expect(authorize('Bearer ' + mobileToken, { ...configured, SANDBOX_ACTIVE_WORKER_HOST: 'mobile', SANDBOX_MOBILE_WORKER_TOKEN: '' })).toBe(false);
  });
  it('rejects unknown active-host values rather than silently falling back', () => {
    expect(authorize('Bearer ' + windowsToken, { ...configured, SANDBOX_ACTIVE_WORKER_HOST: 'both' })).toBe(false);
  });
  it('rejects malformed credentials and arbitrary token bytes', () => {
    expect(authorize(windowsToken, configured)).toBe(false);
    expect(authorize('Bearer '+ 'W'.repeat(42), configured)).toBe(false);
    expect(authorize('Bearer '+ 'W'.repeat(44), configured)).toBe(false);
    expect(authorize('Bearer '+ 'A'.repeat(43), configured)).toBe(false);
  });
});
