import 'server-only';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { firestore, tokenHash } from '@/lib/mcp/connection';

const STATE = 'sandbox_worker_state';
const JOBS = 'sandbox_command_jobs';
const ONLINE_MS = 90_000;
export const poolIdentity = z.object({
  slot: z.number().int().min(1).max(8),
  worker_id: z.string().regex(/^[a-f0-9]{32}$/),
});
export type PoolIdentity = z.infer<typeof poolIdentity>;
type Slot = { workerId: string; jobId: string | null; scope: string; expiresAt: number; lastSeenAt: number };
type Pool = { slots: Record<string, Slot> };
export function poolEnabled() { return process.env.SANDBOX_PARALLEL_ENABLED === 'true'; }
export function poolCapacity() {
  const capacity = Number(process.env.SANDBOX_EXECUTION_SLOTS ?? '2');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 8) throw new Error('INVALID_POOL_CAPACITY');
  return capacity;
}
function identity(input: PoolIdentity) {
  const parsed = poolIdentity.parse(input);
  if (!poolEnabled() || process.env.SANDBOX_AUTH_WORKER_ENFORCE !== 'true' || parsed.slot > poolCapacity()) throw new Error('POOL_SLOT_UNAVAILABLE');
  return parsed;
}
function scopeFor(data: FirebaseFirestore.DocumentData): string {
  const raw = data.kind === 'artifact_read' ? '/workspace/artifacts/' + data.artifactPath : data.cwd;
  const cwd = typeof raw === 'string' ? raw.replace(/\/+/g, '/') : raw;
  if (typeof cwd !== 'string' || !/^\/workspace(?:\/[A-Za-z0-9._-]+)*\/?$/.test(cwd) ||
      cwd.split('/').some(part => part === '.' || part === '..')) throw new Error('INVALID_WORKDIR');
  if (data.exclusiveWorkspace) return '/workspace';
  if (cwd.replace(/\/+$/, '') === '/workspace') return '';
  // Reserve an entire independent task (projects/name, experiments/name, etc).
  // Root/collection commands acquire the corresponding ancestor reservation.
  return cwd.replace(/\/+$/, '').split('/').slice(0, 4).join('/');
}
function overlaps(a: string, b: string) {
  if (a === '/workspace' || b === '/workspace') return true;
  if (!a || !b) return false;
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/');
}

/** At-most-once dispatch: expired claims become worker_lost, never queued.
 * A lost poll response intentionally sacrifices availability, not safety.
 * Docker supervisor must fence the old incarnation before a slot is restarted.
 */
export async function claimPoolJob(input: PoolIdentity) {
  const who = identity(input), db = firestore(), poolRef = db.collection(STATE).doc('pool');
  const queued = await db.collection(JOBS).where('status', '==', 'queued')
    .orderBy('createdAt', 'asc').limit(100).get();
  return db.runTransaction(async tx => {
    const now = Date.now();
    const pool: Pool = (await tx.get(poolRef)).data() as Pool ?? { slots: {} };
    // All transaction reads precede writes. Re-read queue candidates to resolve
    // simultaneous claims even if the outer query saw an older snapshot.
    const slots = { ...pool.slots };
    const active = await Promise.all(Object.entries(slots).filter(([, s]) => s.jobId)
      .map(async ([key, s]) => ({ key, slot: s, ref: db.collection(JOBS).doc(s.jobId!),
        data: (await tx.get(db.collection(JOBS).doc(s.jobId!))).data() })));
    const candidates = await Promise.all(queued.docs.map(async doc => ({ doc, data: (await tx.get(doc.ref)).data() })));
    for (const entry of active) {
      if (entry.data?.status !== 'leased' || entry.slot.expiresAt <= now) {
        if (entry.data?.status === 'leased') tx.update(entry.ref, { status: 'worker_lost', finishedAt: now });
        slots[entry.key] = { ...entry.slot, jobId: null, scope: '', expiresAt: 0 };
      }
    }
    const own = slots[String(who.slot)];
    if (own && own.workerId !== who.worker_id && now - own.lastSeenAt < ONLINE_MS) return null;
    if (own?.jobId) return null; // includes another incarnation: never steal it
    const reservations = Object.values(slots).filter(s => s.jobId);
    const blocked: string[] = [];
    let selected: { job_id: string; lease_token: string; [key: string]: unknown } | null = null;
    for (const { doc, data } of candidates) {
      if (!data || data.status !== 'queued' || data.ownerUid !== process.env.SANDBOX_OWNER_UID) continue;
      if (data.expiresAt <= now) { tx.update(doc.ref, { status: 'expired', finishedAt: now }); continue; }
      const scope = scopeFor(data);
      // Older blocked work reserves its place for conflicting scopes while
      // unrelated task directories continue using idle capacity.
      if (reservations.some(s => overlaps(scope, s.scope)) || blocked.some(s => overlaps(scope, s))) {
        blocked.push(scope); continue;
      }
      const lease = randomBytes(32).toString('base64url');
      const expiresAt = now + Math.max(180_000, data.timeoutSeconds * 1000 + 90_000);
      slots[String(who.slot)] = { workerId: who.worker_id, jobId: doc.id, scope, expiresAt, lastSeenAt: now };
      tx.update(doc.ref, { status: 'leased', startedAt: now, workerVersion: 5,
        workerId: who.worker_id, workerSlot: who.slot, leaseExpiresAt: expiresAt, leaseTokenHash: tokenHash(lease) });
      selected = data.kind === 'artifact_read'
        ? { job_id: doc.id, lease_token: lease, kind: 'artifact_read', artifact_path: data.artifactPath,
            offset: data.offset, length: data.length, timeout_seconds: data.timeoutSeconds }
        : { job_id: doc.id, lease_token: lease, command: data.command, cwd: data.cwd, timeout_seconds: data.timeoutSeconds };
      break;
    }
    if (!selected) slots[String(who.slot)] = { workerId: who.worker_id, jobId: null, scope: '', expiresAt: 0, lastSeenAt: now };
    tx.set(poolRef, { slots });
    return selected;
  });
}

export async function poolHeartbeat(input: PoolIdentity, jobId: string, leaseToken: string) {
  const who = identity(input), db = firestore(), ref = db.collection(STATE).doc('pool');
  return db.runTransaction(async tx => {
    const pool = (await tx.get(ref)).data() as Pool | undefined;
    const job = (await tx.get(db.collection(JOBS).doc(jobId))).data();
    const slot = pool?.slots[String(who.slot)], now = Date.now();
    if (!slot || slot.workerId !== who.worker_id || slot.jobId !== jobId || slot.expiresAt <= now ||
        job?.status !== 'leased' || job.workerId !== who.worker_id || job.leaseExpiresAt <= now ||
        job.leaseTokenHash !== tokenHash(leaseToken)) throw new Error('INVALID_OR_EXPIRED_LEASE');
    // Do not extend hard execution deadlines. A disconnected worker may still
    // be computing; its reservation survives until timeout + cleanup margin.
    tx.set(ref, { slots: { ...pool!.slots, [String(who.slot)]: { ...slot, lastSeenAt: now } } });
    return { acknowledged: true, cancel_requested: typeof job.cancelRequestedAt === 'number' };
  });
}

export async function poolStatus() {
  const data = (await firestore().collection(STATE).doc('pool').get()).data() as Pool | undefined;
  const now = Date.now(), capacity = poolCapacity();
  const workers = Array.from({ length: capacity }, (_, i) => {
    const s = data?.slots[String(i + 1)];
    const age = s ? now - s.lastSeenAt : Infinity;
    return { slot: i + 1, worker_id: s?.workerId ?? null, connected: age >= 0 && age < ONLINE_MS,
      busy: !!s?.jobId && s.expiresAt > now, job_id: s?.jobId ?? null,
      last_seen_at: s?.lastSeenAt ?? null, lease_expires_at: s?.expiresAt || null };
  });
  return { connected: workers.some(w => w.connected), busy: workers.some(w => w.busy),
    execution_slots: capacity, busy_slots: workers.filter(w => w.busy).length, workers };
}
