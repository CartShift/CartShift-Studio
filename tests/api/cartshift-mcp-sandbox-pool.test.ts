import { beforeEach, describe, expect, it, vi } from 'vitest';
const db = vi.hoisted(() => {
  const docs = new Map<string, Record<string, any>>();
  let serial = Promise.resolve();
  const ref = (path: string) => ({ path, id: path.split('/').at(-1), get: async () => ({ data: () => docs.get(path) }) });
  const query = { where: () => query, orderBy: () => query, limit: () => query,
    get: async () => ({ docs: [...docs.entries()].filter(([p, d]) => p.startsWith('sandbox_command_jobs/') && d.status === 'queued')
      .sort((a, b) => a[1].createdAt - b[1].createdAt).map(([p, d]) => ({ ...ref(p), ref: ref(p), data: () => d })) }) };
  return { docs, instance: { collection: (name: string) => ({ ...query, doc: (id: string) => ref(name + '/' + id) }),
    runTransaction: (fn: any) => { const result = serial.then(() => fn({ get: (r: any) => r.get(),
      set: (r: any, value: any) => docs.set(r.path, value), update: (r: any, value: any) => docs.set(r.path, { ...docs.get(r.path), ...value }) }));
      serial = result.catch(() => {}); return result; } } };
});
vi.mock('@/lib/mcp/connection', () => ({ firestore: () => db.instance, tokenHash: (s: string) => 'hashed:' + s }));
import { claimPoolJob, poolHeartbeat, poolStatus } from '@/lib/mcp/sandbox-pool';
const a = { slot: 1, worker_id: 'a'.repeat(32) }, b = { slot: 2, worker_id: 'b'.repeat(32) };
function job(id: number, cwd = '/workspace/experiments/task-' + id) {
  db.docs.set('sandbox_command_jobs/job-' + id, { ownerUid: 'owner', status: 'queued', command: 'sleep 10', cwd,
    timeoutSeconds: 20, createdAt: id, expiresAt: Date.now() + 60000 });
}
beforeEach(() => { db.docs.clear(); vi.stubEnv('SANDBOX_OWNER_UID', 'owner'); vi.stubEnv('SANDBOX_AUTH_WORKER_ENFORCE', 'true'); vi.stubEnv('SANDBOX_PARALLEL_ENABLED', 'true'); vi.stubEnv('SANDBOX_EXECUTION_SLOTS', '2'); });
describe('atomic parallel pool', () => {
  it('claims two FIFO jobs concurrently and queues a third without duplicating a claim', async () => {
    job(1); job(2); job(3);
    const claimed = await Promise.all([claimPoolJob(a), claimPoolJob(b), claimPoolJob(a)]);
    expect(claimed.filter(Boolean).map(j => j!.job_id).sort()).toEqual(['job-1', 'job-2']);
    expect(db.docs.get('sandbox_command_jobs/job-3')!.status).toBe('queued');
    db.docs.get('sandbox_command_jobs/job-1')!.status = 'completed';
    expect(await claimPoolJob(a)).toMatchObject({ job_id: 'job-3' });
  });
  it('runs unchanged default-cwd submissions concurrently', async () => {
    job(1, '/workspace'); job(2, '/workspace');
    expect((await Promise.all([claimPoolJob(a), claimPoolJob(b)])).filter(Boolean)).toHaveLength(2);
  });
  it('reserves the entire workspace explicitly for shared mutations', async () => {
    job(1, '/workspace'); db.docs.get('sandbox_command_jobs/job-1')!.exclusiveWorkspace = true; job(2);
    await claimPoolJob(a); expect(await claimPoolJob(b)).toBeNull();
  });
  it('serializes overlapping cwd trees while allowing unrelated work to proceed', async () => {
    job(1, '/workspace/projects/a'); job(2, '/workspace/projects/a/sub'); job(3);
    expect(await claimPoolJob(a)).toMatchObject({ job_id: 'job-1' });
    expect(await claimPoolJob(b)).toMatchObject({ job_id: 'job-3' });
  });
  it('does not requeue uncertain jobs when a slot lease expires', async () => {
    job(1); job(2); await claimPoolJob(a);
    const pool = db.docs.get('sandbox_worker_state/pool')!;
    pool.slots['1'].expiresAt = Date.now() - 1;
    pool.slots['1'].lastSeenAt = Date.now() - 91_000;
    expect(await claimPoolJob({ ...a, worker_id: 'c'.repeat(32) })).toMatchObject({ job_id: 'job-2' });
    expect(db.docs.get('sandbox_command_jobs/job-1')!.status).toBe('worker_lost');
  });
  it('rejects stale heartbeat identities and invalid capacity', async () => {
    job(1); const claimed = await claimPoolJob(a);
    await expect(poolHeartbeat({ ...a, worker_id: 'c'.repeat(32) }, 'job-1', claimed!.lease_token)).rejects.toThrow();
    await expect(claimPoolJob({ ...a, slot: 3 })).rejects.toThrow();
  });
  it('reports independently busy workers and capacity through the status interface', async () => {
    job(1); job(2); await Promise.all([claimPoolJob(a), claimPoolJob(b)]);
    expect(await poolStatus()).toMatchObject({ connected: true, busy: true, execution_slots: 2, busy_slots: 2 });
  });
});
