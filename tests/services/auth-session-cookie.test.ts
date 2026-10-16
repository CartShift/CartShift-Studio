import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { syncSessionCookie } from '@/lib/services/auth';

vi.mock('@/lib/firebase', () => ({ getFirebaseAuth: vi.fn(), getFirestoreDb: vi.fn() }));
vi.mock('@/lib/services/portal-organizations', () => ({
  getPendingClientInvites: vi.fn(), acceptClientInvite: vi.fn(),
  getInvitesByEmail: vi.fn(), acceptInvite: vi.fn(),
}));

const user = { getIdToken: vi.fn().mockResolvedValue('test-id-token') } as unknown as User;
const fetchMock = vi.fn();
const strictSync = () => syncSessionCookie(user, { required: true });

describe('server session synchronization', () => {
  beforeEach(() => { vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset(); });
  afterEach(() => vi.unstubAllGlobals());

  it('rejects an unsuccessful HTTP response when a server session is required', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(strictSync()).rejects.toThrow(/session/i);
  });
  it.each(['{}', '{"status":"error"}', 'invalid json'])('rejects an unverified session response %s', async body => {
    fetchMock.mockResolvedValue(new Response(body, { status: 200 }));
    await expect(strictSync()).rejects.toThrow(/session/i);
  });
  it('propagates a transport failure for an OAuth continuation', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));
    await expect(strictSync()).rejects.toThrow('Network unavailable');
  });
  it('accepts a confirmed session', async () => {
    fetchMock.mockResolvedValue(Response.json({ status: 'success' }));
    await expect(strictSync()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({ method: 'POST', body: JSON.stringify({ idToken: 'test-id-token' }) }));
  });
  it('preserves best-effort synchronization for ordinary portal login', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));
    await expect(syncSessionCookie(user)).resolves.toBeUndefined();
  });
  it('preserves logout cookie cleanup', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await syncSessionCookie(null);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', { method: 'DELETE' });
  });
});
