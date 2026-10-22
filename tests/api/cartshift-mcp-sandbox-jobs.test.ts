import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  created: vi.fn(),
  read: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
  transaction: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/mcp/connection', () => ({
  constantEquals: (a: string, b: string) => a === b,
  tokenHash: (s: string) => s,
  firestore: () => ({
    collection: mocks.collection,
    runTransaction: mocks.transaction,
  }),
}));

import {
  authorizeSandboxOwner, authorizeSandboxWorker,
  submitSandboxCommand, getSandboxCommand, getSandboxStatus, cancelSandboxCommand,
  redactSandboxOutput, recordSandboxHeartbeat,
} from '@/lib/mcp/sandbox-jobs';

const owner = {
  uid: 'firebase-owner-123',
  clientId: 'chatgpt-client',
  scope: ['work:read', 'work:write'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
  expiresAt: Date.now() + 60_000,
};

describe('CartShift owner-only sandbox job submission', () => {
  beforeEach(() => {
    vi.stubEnv('SANDBOX_OWNER_UID', owner.uid);
    vi.stubEnv('SANDBOX_WORKER_TOKEN', 'a'.repeat(48));
    vi.clearAllMocks();
    mocks.doc.mockReturnValue({
      id: 'sandbox-job-12345678',
      create: mocks.created,
      get: mocks.read,
      set: vi.fn(),
    });
    mocks.collection.mockReturnValue({ doc: mocks.doc });
  });
  afterEach(() => vi.unstubAllEnvs());

  it('requires exact owner identity even for another authenticated agency account', async () => {
    await expect(submitSandboxCommand({
      ...owner, uid: 'another-agency-user',
    }, { command: 'echo hello' })).rejects.toThrow('SANDBOX_FORBIDDEN');
    expect(mocks.created).not.toHaveBeenCalled();
  });

  it('queues a command without executing it on the application server', async () => {
    const result = await submitSandboxCommand(owner, {
      command: 'id -u', cwd: '/workspace', timeout_seconds: 15,
    });
    expect(result).toEqual({
      job_id: 'sandbox-job-12345678', status: 'queued', dockerConnected: 'unverified',
    });
    expect(mocks.created).toHaveBeenCalledWith(expect.objectContaining({
      ownerUid: owner.uid, command: 'id -u',
      cwd: '/workspace', timeoutSeconds: 15, status: 'queued',
    }));
  });

  it('rejects path traversal and unexpected arguments', async () => {
    await expect(submitSandboxCommand(owner, {
      command: 'pwd', cwd: '/workspace/../etc',
    })).rejects.toThrow();
    await expect(submitSandboxCommand(owner, {
      command: 'pwd', extra: 'unexpected',
    })).rejects.toThrow();
    expect(mocks.created).not.toHaveBeenCalled();
  });

  it('fails closed when owner or worker configuration is absent', async () => {
    vi.stubEnv('SANDBOX_OWNER_UID', '');
    expect(() => authorizeSandboxOwner(owner)).toThrow('SANDBOX_NOT_CONFIGURED');
    expect(authorizeSandboxWorker('Bearer ' + 'a'.repeat(48))).toBe(true);
    vi.stubEnv('SANDBOX_WORKER_TOKEN', '');
    expect(authorizeSandboxWorker('Bearer ' + 'a'.repeat(48))).toBe(false);
    await expect(submitSandboxCommand(owner, { command: 'pwd' }))
      .rejects.toThrow('SANDBOX_NOT_CONFIGURED');
  });

  it('denies reading another owner\'s result', async () => {
    mocks.read.mockResolvedValue({
      exists: true, data: () => ({ ownerUid: 'other-user', status: 'completed' }),
    });
    await expect(getSandboxCommand(owner, { job_id: 'sandbox-job-12345678' }))
      .rejects.toThrow('JOB_NOT_FOUND');
  });
  it.each([[0, 'completed'], [7, 'failed'], [124, 'timed_out']])('reports command exit %s as %s', async (exitCode, status) => {
    mocks.read.mockResolvedValue({ exists: true, data: () => ({ ownerUid: owner.uid,
      status: 'completed', exitCode, stdout: 'real output', stderr: '', createdAt: Date.now() }) });
    await expect(getSandboxCommand(owner, { job_id: 'sandbox-job-12345678' }))
      .resolves.toMatchObject({ status, exit_code: exitCode, stdout: 'real output' });
  });

  it('adds an actual Firestore TTL Timestamp to new job records', async () => {
    await submitSandboxCommand(owner, { command: 'echo safe' });
    const data = mocks.created.mock.calls[0][0];
    expect(typeof data.purgeAt.toMillis).toBe('function');
    expect(data.purgeAt.toMillis()).toBeGreaterThan(data.expiresAt);
  });

  it('reports worker heartbeat and capabilities without exposing connection secrets', async () => {
    mocks.read.mockResolvedValue({ exists: true,
      data: () => ({ lastSeenAt: Date.now(), version: 2, busy: false }) });
    await expect(getSandboxStatus(owner)).resolves.toMatchObject({
      connected: true, state: 'online', max_command_seconds: 600, busy: false,
    });
  });

  it('requires a current v2 heartbeat for long commands', async () => {
    mocks.read.mockResolvedValue({ exists: false, data: () => undefined });
    await expect(submitSandboxCommand(owner, { command: 'sleep 150', timeout_seconds: 150 }))
      .rejects.toThrow('SANDBOX_WORKER_UPDATE_REQUIRED');
    expect(mocks.created).not.toHaveBeenCalled();
    mocks.read.mockResolvedValue({ exists: true,
      data: () => ({ lastSeenAt: Date.now(), version: 2 }) });
    await submitSandboxCommand(owner, { command: 'sleep 150', timeout_seconds: 150 });
    expect(mocks.created).toHaveBeenCalledTimes(1);
  });

  it('redacts credential-like strings before persisting logs', () => {
    const raw = 'Bearer ' + 'x'.repeat(45) +
      '\\naccess_token=abcd1234abcdefgh\\nghp_' + 'Y'.repeat(38);
    const redacted = redactSandboxOutput(raw);
    expect(redacted).not.toContain('x'.repeat(45));
    expect(redacted).not.toContain('abcd1234abcdefgh');
    expect(redacted).not.toContain('ghp_');
  });

  it('only cancels an owned queued job inside a transaction', async () => {
    const data = { ownerUid: owner.uid, status: 'queued', expiresAt: Date.now() + 50_000 };
    mocks.transaction.mockImplementation(async callback => callback({
      get: async () => ({ data: () => data }), update: mocks.update,
    }));
    await expect(cancelSandboxCommand(owner, { job_id: 'sandbox-job-12345678' }))
      .resolves.toMatchObject({ cancelled: true, status: 'cancelled' });
    expect(mocks.update).toHaveBeenCalledWith(expect.anything(),
      expect.objectContaining({ status: 'cancelled' }));
    data.status = 'leased';
    await expect(cancelSandboxCommand(owner, { job_id: 'sandbox-job-12345678' }))
      .resolves.toMatchObject({ cancelled: false, status: 'leased' });
  });

  it('records v2 heartbeat with worker state only', async () => {
    const set = vi.fn();
    mocks.doc.mockReturnValueOnce({ set });
    await recordSandboxHeartbeat(true);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({
      busy: true, version: 2, lastSeenAt: expect.any(Number),
    }), { merge: true });
  });

});
