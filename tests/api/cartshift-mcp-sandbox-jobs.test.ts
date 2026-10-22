import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  created: vi.fn(),
  read: vi.fn(),
  doc: vi.fn(),
  collection: vi.fn(),
}));

vi.mock('@/lib/mcp/connection', () => ({
  constantEquals: (a: string, b: string) => a === b,
  tokenHash: (s: string) => s,
  firestore: () => ({
    collection: mocks.collection,
  }),
}));

import {
  authorizeSandboxOwner, authorizeSandboxWorker,
  submitSandboxCommand, getSandboxCommand,
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
});
