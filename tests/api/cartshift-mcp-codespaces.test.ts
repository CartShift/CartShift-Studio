import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ audit: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/mcp/connection', () => ({
  AUDIT: 'cartshift_mcp_audit',
  firestore: () => ({ collection: () => ({ add: mocks.audit }) }),
}));
vi.mock('@/lib/mcp/sandbox-jobs', () => ({
  authorizeSandboxOwner: (grant: { uid: string }) => {
    if (grant.uid !== 'owner') throw new Error('SANDBOX_FORBIDDEN');
  },
}));

import { callCodespacesTool } from '@/lib/mcp/github-codespaces';

const grant = {
  uid: 'owner', clientId: 'test', scope: ['work:read', 'work:write'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp', expiresAt: Date.now() + 60_000,
};
const record = {
  name: 'witty-space-123', state: 'Shutdown', web_url: 'https://example.github.dev',
  owner: { login: 'yotamon' }, billable_owner: { login: 'yotamon' },
  repository: { full_name: 'yotamon/WakeMyWay' },
  machine: { cpus: 2, display_name: '2 cores' }, idle_timeout_minutes: 15,
};
const ok = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

describe('GitHub Codespaces MCP control plane', () => {
  beforeEach(() => {
    vi.stubEnv('GITHUB_CODESPACES_TOKEN', 'github-token-placeholder-123456789');
    vi.stubEnv('GITHUB_CODESPACES_REPOSITORY', 'yotamon/WakeMyWay');
    vi.stubEnv('GITHUB_CODESPACES_LIFECYCLE_ENABLED', 'false');
    mocks.fetch.mockReset();
    mocks.audit.mockReset().mockResolvedValue({ id: 'audit' });
    vi.stubGlobal('fetch', mocks.fetch);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

  it('reports configuration but never leaks tokens or claims command execution', async () => {
    const result = await callCodespacesTool('sandbox_codespaces_status', {}, grant);
    expect(result).toMatchObject({
      configured: true, repository: 'yotamon/WakeMyWay',
      lifecycle_enabled: false, execution_bridge_connected: false,
    });
    expect(JSON.stringify(result)).not.toContain('github-token');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('blocks other CartShift actors before making an external call', async () => {
    await expect(callCodespacesTool('sandbox_codespaces_list', {}, { ...grant, uid: 'other' }))
      .rejects.toThrow('SANDBOX_FORBIDDEN');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('lists only the personal allowlisted repository without starting compute', async () => {
    mocks.fetch.mockImplementation(async (url: string) => {
      if (url.endsWith('/user')) return ok({ login: 'yotamon', type: 'User' });
      if (url.includes('/user/codespaces?')) return ok({
        total_count: 2, codespaces: [record, { ...record, name: 'other', repository: { full_name: 'yotamon/StarLinker' } }],
      });
      throw new Error('Unexpected call ' + url);
    });
    const result = await callCodespacesTool('sandbox_codespaces_list', {}, grant);
    expect(result).toMatchObject({ codespaces: [{ name: record.name }], execution_bridge_connected: false });
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch.mock.calls.every((c: unknown[]) => (c[1] as { method: string }).method === 'GET')).toBe(true);
  });

  it('fails closed if the GitHub token belongs to a different personal account', async () => {
    mocks.fetch.mockResolvedValue(ok({ login: 'another-user', type: 'User' }));
    await expect(callCodespacesTool('sandbox_codespaces_list', {}, grant))
      .rejects.toThrow('CODESPACES_TOKEN_OWNER_MISMATCH');
  });

  it('does not permit creating or starting compute without a second lifecycle opt-in', async () => {
    await expect(callCodespacesTool('sandbox_codespaces_create', {}, grant))
      .rejects.toThrow('CODESPACES_LIFECYCLE_DISABLED');
    await expect(callCodespacesTool('sandbox_codespaces_start', { name: record.name }, grant))
      .rejects.toThrow('CODESPACES_LIFECYCLE_DISABLED');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('refuses foreign billing ownership before a start request', async () => {
    vi.stubEnv('GITHUB_CODESPACES_LIFECYCLE_ENABLED', 'true');
    mocks.fetch.mockImplementation(async (url: string) => {
      if (url.endsWith('/user')) return ok({ login: 'yotamon', type: 'User' });
      return ok({ ...record, billable_owner: { login: 'CartShift' } });
    });
    await expect(callCodespacesTool('sandbox_codespaces_start', { name: record.name }, grant))
      .rejects.toThrow('CODESPACES_UNAPPROVED_OWNER_OR_BILLING');
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
  });

  it('creates only a two-core machine and records audit intent before the metered call', async () => {
    vi.stubEnv('GITHUB_CODESPACES_LIFECYCLE_ENABLED', 'true');
    mocks.fetch.mockImplementation(async (url: string, init: { method: string; body?: string }) => {
      if (url.endsWith('/user')) return ok({ login: 'yotamon', type: 'User' });
      if (url.includes('/user/codespaces?')) return ok({ total_count: 0, codespaces: [] });
      if (url.endsWith('/codespaces/machines')) return ok({
        machines: [{ name: 'large', cpus: 4 }, { name: 'basicLinux32gb', cpus: 2 }],
      });
      if (url.endsWith('/codespaces') && init.method === 'POST') {
        expect(mocks.audit).toHaveBeenCalledOnce();
        expect(JSON.parse(init.body!)).toMatchObject({
          machine: 'basicLinux32gb', geo: 'EuropeWest',
          idle_timeout_minutes: 15, multi_repo_permissions_opt_out: true,
        });
        return ok(record, 201);
      }
      throw new Error('Unexpected request ' + url);
    });
    await expect(callCodespacesTool('sandbox_codespaces_create', {}, grant))
      .resolves.toMatchObject({ codespace: { name: record.name }, execution_bridge_connected: false });
  });

  it('stops a verified Codespace and never deletes its storage', async () => {
    vi.stubEnv('GITHUB_CODESPACES_LIFECYCLE_ENABLED', 'true');
    mocks.fetch.mockImplementation(async (url: string, init: { method: string }) => {
      if (url.endsWith('/user')) return ok({ login: 'yotamon', type: 'User' });
      if (url.endsWith('/' + record.name)) return ok({ ...record, state: 'Available' });
      if (url.endsWith('/' + record.name + '/stop') && init.method === 'POST') return ok(record);
      throw new Error('Unexpected request ' + url);
    });
    await expect(callCodespacesTool('sandbox_codespaces_stop', { name: record.name }, grant))
      .resolves.toMatchObject({ codespace: { name: record.name } });
    expect(mocks.fetch.mock.calls.some((c: unknown[]) => String(c[0]).includes('/delete'))).toBe(false);
  });

  it('rejects injected URLs and extra arguments', async () => {
    vi.stubEnv('GITHUB_CODESPACES_LIFECYCLE_ENABLED', 'true');
    await expect(callCodespacesTool('sandbox_codespaces_start', { name: '../../evil' }, grant))
      .rejects.toThrow();
    await expect(callCodespacesTool('sandbox_codespaces_list', { token: 'unsafe' }, grant))
      .rejects.toThrow();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
