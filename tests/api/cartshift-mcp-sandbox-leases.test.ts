import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ data: {} as Record<string, unknown>, update: vi.fn(), tx: {} as { get: (ref: unknown) => Promise<{ data: () => Record<string, unknown> }>; update: (ref: unknown, change: Record<string, unknown>) => void } }));
vi.mock('@/lib/mcp/connection', () => ({
  constantEquals: (a: string, b: string) => a === b,
  tokenHash: (s: string) => 'hashed:' + s,
  firestore: () => ({
    collection: () => ({
      doc: () => ({ id: 'sandbox-job-12345678' }),
      where: () => ({ limit: () => ({ get: async () => ({ docs: [{ id: 'sandbox-job-12345678', ref: {} }] }) }) }),
    }),
    runTransaction: async (fn: (tx: typeof state.tx) => Promise<unknown>) => fn(state.tx),
  }),
}));
import { completeSandboxJob, leaseSandboxJob } from '@/lib/mcp/sandbox-jobs';

const completion = { job_id: 'sandbox-job-12345678', lease_token: 'l'.repeat(40),
  exit_code: 0, stdout: 'actual output', stderr: '', duration_ms: 12, output_truncated: false };

describe('sandbox one-use leases and completion retries', () => {
  beforeEach(() => {
    vi.stubEnv('SANDBOX_OWNER_UID', 'owner');
    vi.stubEnv('SANDBOX_WORKER_TOKEN', 't'.repeat(64));
    state.data = { ownerUid: 'owner', status: 'leased', leaseTokenHash: 'hashed:' + completion.lease_token,
      leaseExpiresAt: Date.now() + 60000 };
    state.update.mockReset().mockImplementation((_ref, change) => Object.assign(state.data, change));
    state.tx = { get: async () => ({ data: () => state.data }), update: state.update };
  });
  afterEach(() => vi.unstubAllEnvs());
  it('acknowledges an identical completion retry without overwriting the result', async () => {
    await expect(completeSandboxJob(completion)).resolves.toEqual({ acknowledged: true });
    await expect(completeSandboxJob(completion)).resolves.toEqual({ acknowledged: true });
    expect(state.update).toHaveBeenCalledTimes(1);
  });
  it('rejects a changed result after the job completed', async () => {
    await completeSandboxJob(completion);
    await expect(completeSandboxJob({ ...completion, stdout: 'forged replacement' })).rejects.toThrow();
    expect(state.data.stdout).toBe('actual output');
  });
  it('rejects a wrong lease and an expired lease', async () => {
    await expect(completeSandboxJob({ ...completion, lease_token: 'x'.repeat(40) })).rejects.toThrow();
    state.data.leaseExpiresAt = Date.now() - 1;
    await expect(completeSandboxJob(completion)).rejects.toThrow();
    expect(state.update).not.toHaveBeenCalled();
  });
  it('removes expired jobs from the queued scan so they cannot starve newer commands', async () => {
    state.data = { ownerUid: 'owner', status: 'queued', expiresAt: Date.now() - 1 };
    await expect(leaseSandboxJob()).resolves.toBeNull();
    expect(state.data.status).toBe('expired');
  });
  it('never leases V4-only artifacts to a legacy worker', async () => {
    state.data = { ownerUid: 'owner', status: 'queued', kind: 'artifact_read',
      artifactPath: 'results/fixture.bin', offset: 0, length: 100,
      timeoutSeconds: 20, expiresAt: Date.now() + 60_000 };
    await expect(leaseSandboxJob(3)).resolves.toBeNull();
    expect(state.update).not.toHaveBeenCalled();
    await expect(leaseSandboxJob(4)).resolves.toMatchObject({
      kind: 'artifact_read', artifact_path: 'results/fixture.bin',
      offset: 0, length: 100,
    });
    expect(state.update).toHaveBeenCalledTimes(1);
  });
  it('never leases a job already claimed by another worker', async () => {
    await expect(leaseSandboxJob()).resolves.toBeNull();
    expect(state.update).not.toHaveBeenCalled();
  });
});
