import 'server-only';

import { randomBytes } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { constantEquals, firestore, tokenHash, type TokenGrant } from '@/lib/mcp/connection';

const JOBS = 'sandbox_command_jobs';
const JOB_MAX_AGE_MS = 10 * 60_000;
const LEASE_MS = 180_000;
const MAX_OUTPUT = 24_000;
const JOB_RETENTION_MS = 7 * 24 * 60 * 60_000;
const WORKER_ONLINE_MS = 90_000;
const MAX_COMMAND_SECONDS = 600;
const WORKER_STATE = 'sandbox_worker_state';

function jobStatus(data: FirebaseFirestore.DocumentData) {
  return data.status === 'queued' && Date.now() > data.expiresAt ? 'expired'
    : data.status === 'leased' && Date.now() > data.leaseExpiresAt ? 'worker_lost'
    : data.status === 'completed' && data.exitCode === 124 ? 'timed_out'
    : data.status === 'completed' && data.exitCode !== 0 ? 'failed'
    : data.status;
}

function publicJobResult(jobId: string, data: FirebaseFirestore.DocumentData) {
  return {
    job_id: jobId, status: jobStatus(data), created_at: data.createdAt,
    started_at: data.startedAt ?? null, finished_at: data.finishedAt ?? null,
    exit_code: data.exitCode ?? null,
    stdout: typeof data.stdout === 'string' ? data.stdout : null,
    stderr: typeof data.stderr === 'string' ? data.stderr : null,
    duration_ms: data.durationMs ?? null,
    output_truncated: Boolean(data.outputTruncated),
    output_redacted: Boolean(data.outputRedacted),
  };
}

// Defense in depth: never persist recognizable bearer/private credentials in job logs.
// The caller must still avoid running commands that print arbitrary secrets.
export function redactSandboxOutput(value: string): string {
  return value
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED PRIVATE KEY]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]{20,}={0,2}/gi, '$1[REDACTED]')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|ya29\.[A-Za-z0-9._-]{15,})\b/g, '[REDACTED TOKEN]')
    .replace(/((?:access_token|refresh_token|client_secret|private_key|api_key|FIREBASE_TOKEN|GOOGLE_APPLICATION_CREDENTIALS)\s*[:=]\s*["']?)[^\s"',}]{8,}/gi, '$1[REDACTED]');
}

async function workerIsV2(): Promise<boolean> {
  const data = (await firestore().collection(WORKER_STATE).doc('primary').get()).data();
  return !!data && data.version >= 2 && typeof data.lastSeenAt === 'number' &&
    Date.now() - data.lastSeenAt < WORKER_ONLINE_MS && Date.now() >= data.lastSeenAt;
}

export async function getSandboxStatus(grant: TokenGrant) {
  authorizeSandboxOwner(grant);
  const snap = await firestore().collection(WORKER_STATE).doc('primary').get();
  const data = snap.data();
  const age = typeof data?.lastSeenAt === 'number' ? Date.now() - data.lastSeenAt : null;
  const online = age !== null && age >= 0 && age < WORKER_ONLINE_MS;
  return { connected: online, state: online ? 'online' : 'offline',
    last_seen_at: data?.lastSeenAt ?? null, worker_version: data?.version ?? null,
    max_command_seconds: online && data?.version >= 2 ? MAX_COMMAND_SECONDS : 120,
    capabilities: online && data?.version >= 2
      ? ['adaptive_polling', 'cancel_queued', 'long_commands', 'output_truncation'] : [],
  };
}

export async function recordSandboxHeartbeat() {
  configured();
  await firestore().collection(WORKER_STATE).doc('primary').set({
    lastSeenAt: Date.now(), version: 2,
  }, { merge: true });
  return { acknowledged: true };
}

export async function cancelSandboxCommand(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  const { job_id } = z.object({ job_id: z.string().min(12).max(128) }).strict().parse(input);
  const ref = firestore().collection(JOBS).doc(job_id);
  return firestore().runTransaction(async tx => {
    const doc = await tx.get(ref);
    const data = doc.data();
    if (!data || data.ownerUid !== grant.uid) throw new Error('JOB_NOT_FOUND');
    if (data.status !== 'queued' || data.expiresAt < Date.now()) {
      return { job_id, cancelled: false, status: jobStatus(data) };
    }
    tx.update(ref, { status: 'cancelled', finishedAt: Date.now() });
    return { job_id, cancelled: true, status: 'cancelled' };
  });
}

async function awaitJob(ref: FirebaseFirestore.DocumentReference, jobId: string, seconds: number) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let stopped = false;
    let unsubscribe: (() => void) | undefined;
    const finish = (result?: Record<string, unknown>, error?: Error) => {
      if (stopped) return;
      stopped = true;
      clearTimeout(timer);
      unsubscribe?.();
      if (error) reject(error);
      else resolve(result!);
    };
    const timer = setTimeout(() => finish({ job_id: jobId, status: 'running', pending: true }), seconds * 1000);
    unsubscribe = ref.onSnapshot(snap => {
      const data = snap.data();
      if (data && ['completed', 'cancelled', 'expired'].includes(data.status)) finish(publicJobResult(jobId, data));
    }, error => finish(undefined, error));
    if (stopped) unsubscribe?.();
  });
}


const commandInput = z.object({
  command: z.string().trim().min(1).max(2000),
  cwd: z.string().min(10).max(300).regex(/^\/workspace(?:\/[A-Za-z0-9._/-]+)?$/).default('/workspace'),
  timeout_seconds: z.number().int().min(1).max(MAX_COMMAND_SECONDS).default(60),
  wait_seconds: z.number().int().min(0).max(15).default(0),
}).strict();

function configured() {
  if (!process.env.SANDBOX_OWNER_UID || !process.env.SANDBOX_WORKER_TOKEN ||
      process.env.SANDBOX_WORKER_TOKEN.length < 32) {
    throw new Error('SANDBOX_NOT_CONFIGURED');
  }
}

export function authorizeSandboxOwner(grant: TokenGrant) {
  configured();
  if (grant.uid !== process.env.SANDBOX_OWNER_UID) throw new Error('SANDBOX_FORBIDDEN');
}

export function authorizeSandboxWorker(header: string | null): boolean {
  const token = process.env.SANDBOX_WORKER_TOKEN;
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(header || '');
  return Boolean(token && token.length >= 32 && match && constantEquals(match[1], token));
}

export async function submitSandboxCommand(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  const args = commandInput.parse(input);
  // Reject path traversal here and in the container worker.
  if (args.cwd.split('/').some(segment => segment === '..' || segment === '.')) {
    throw new Error('INVALID_WORKDIR');
  }
  if (args.timeout_seconds > 120 && !(await workerIsV2())) {
    throw new Error('SANDBOX_WORKER_UPDATE_REQUIRED');
  }
  const now = Date.now();
  const ref = firestore().collection(JOBS).doc();
  await ref.create({
    ownerUid: grant.uid, command: args.command, cwd: args.cwd,
    timeoutSeconds: args.timeout_seconds, status: 'queued',
    createdAt: now, expiresAt: now + JOB_MAX_AGE_MS,
    purgeAt: Timestamp.fromMillis(now + JOB_RETENTION_MS),
  });
  if (args.wait_seconds > 0) return await awaitJob(ref, ref.id, args.wait_seconds);
  return { job_id: ref.id, status: 'queued', dockerConnected: 'unverified' };
}

export async function getSandboxCommand(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  const { job_id } = z.object({ job_id: z.string().min(12).max(128) }).strict().parse(input);
  const snap = await firestore().collection(JOBS).doc(job_id).get();
  if (!snap.exists || snap.data()?.ownerUid !== grant.uid) throw new Error('JOB_NOT_FOUND');
  const data = snap.data()!;
  return publicJobResult(job_id, data);
}

export async function leaseSandboxJob() {
  configured();
  const db = firestore();
  const jobs = db.collection(JOBS);
  // A single-field status index is enough; scan at most 20 pending jobs.
  const candidates = await jobs.where('status', '==', 'queued').limit(20).get();
  for (const doc of candidates.docs) {
    const leaseToken = randomBytes(32).toString('base64url');
    const now = Date.now();
    const claim = await db.runTransaction(async tx => {
      const fresh = await tx.get(doc.ref);
      const data = fresh.data();
      if (!data || data.status !== 'queued' ||
          data.ownerUid !== process.env.SANDBOX_OWNER_UID) return null;
      if (data.expiresAt <= now) {
        tx.update(doc.ref, { status: 'expired', finishedAt: now });
        return null;
      }
      tx.update(doc.ref, {
        status: 'leased', startedAt: now,
        leaseExpiresAt: now + Math.max(LEASE_MS, data.timeoutSeconds * 1000 + 90_000),
        leaseTokenHash: tokenHash(leaseToken),
      });
      return {
        job_id: doc.id, command: data.command, cwd: data.cwd,
        timeout_seconds: data.timeoutSeconds, lease_token: leaseToken,
      };
    });
    if (claim) return claim;
  }
  return null;
}

export async function completeSandboxJob(input: unknown) {
  configured();
  const args = z.object({
    job_id: z.string().min(12).max(128),
    lease_token: z.string().min(32).max(128),
    exit_code: z.number().int().min(-255).max(255),
    stdout: z.string().max(MAX_OUTPUT),
    stderr: z.string().max(MAX_OUTPUT),
    duration_ms: z.number().int().min(0).max((MAX_COMMAND_SECONDS + 60) * 1000),
    output_truncated: z.boolean(),
  }).strict().parse(input);
  const ref = firestore().collection(JOBS).doc(args.job_id);
  return firestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = snap.data();
    const completionHash = tokenHash(JSON.stringify(args));
    const leaseHash = tokenHash(args.lease_token);
    // A lost HTTPS response must not turn a successfully stored result into
    // an error. Accept only the identical result with the original lease.
    if (data?.status === 'completed' &&
        typeof data.completedLeaseTokenHash === 'string' &&
        constantEquals(data.completedLeaseTokenHash, leaseHash) &&
        typeof data.completionHash === 'string' &&
        constantEquals(data.completionHash, completionHash)) {
      return { acknowledged: true };
    }
    if (!data || data.status !== 'leased' || typeof data.leaseTokenHash !== 'string' ||
        !constantEquals(data.leaseTokenHash, tokenHash(args.lease_token)) ||
        Date.now() > data.leaseExpiresAt) {
      throw new Error('INVALID_OR_EXPIRED_LEASE');
    }
    const stdout = redactSandboxOutput(args.stdout);
    const stderr = redactSandboxOutput(args.stderr);
    tx.update(ref, {
      status: 'completed', finishedAt: Date.now(),
      exitCode: args.exit_code, stdout, stderr,
      outputRedacted: stdout !== args.stdout || stderr !== args.stderr,
      durationMs: args.duration_ms, outputTruncated: args.output_truncated,
      leaseTokenHash: null, completedLeaseTokenHash: leaseHash, completionHash,
    });
    return { acknowledged: true };
  });
}
