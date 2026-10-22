import 'server-only';

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { constantEquals, firestore, tokenHash, type TokenGrant } from '@/lib/mcp/connection';

const JOBS = 'sandbox_command_jobs';
const JOB_MAX_AGE_MS = 10 * 60_000;
const LEASE_MS = 180_000;
const MAX_OUTPUT = 24_000;

const commandInput = z.object({
  command: z.string().trim().min(1).max(2000),
  cwd: z.string().min(10).max(300).regex(/^\/workspace(?:\/[A-Za-z0-9._/-]+)?$/).default('/workspace'),
  timeout_seconds: z.number().int().min(1).max(120).default(60),
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
  const now = Date.now();
  const ref = firestore().collection(JOBS).doc();
  await ref.create({
    ownerUid: grant.uid, command: args.command, cwd: args.cwd,
    timeoutSeconds: args.timeout_seconds, status: 'queued',
    createdAt: now, expiresAt: now + JOB_MAX_AGE_MS,
  });
  return { job_id: ref.id, status: 'queued', dockerConnected: 'unverified' };
}

export async function getSandboxCommand(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  const { job_id } = z.object({ job_id: z.string().min(12).max(128) }).strict().parse(input);
  const snap = await firestore().collection(JOBS).doc(job_id).get();
  if (!snap.exists || snap.data()?.ownerUid !== grant.uid) throw new Error('JOB_NOT_FOUND');
  const data = snap.data()!;
  const status = data.status === 'queued' && Date.now() > data.expiresAt ? 'expired'
    : data.status === 'leased' && Date.now() > data.leaseExpiresAt ? 'worker_lost'
    : data.status === 'completed' && data.exitCode === 124 ? 'timed_out'
    : data.status === 'completed' && data.exitCode !== 0 ? 'failed'
    : data.status;
  return {
    job_id, status, created_at: data.createdAt,
    started_at: data.startedAt ?? null, finished_at: data.finishedAt ?? null,
    exit_code: data.exitCode ?? null,
    stdout: typeof data.stdout === 'string' ? data.stdout : null,
    stderr: typeof data.stderr === 'string' ? data.stderr : null,
    duration_ms: data.durationMs ?? null,
    output_truncated: Boolean(data.outputTruncated),
  };
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
        leaseExpiresAt: now + LEASE_MS,
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
    duration_ms: z.number().int().min(0).max(200_000),
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
    tx.update(ref, {
      status: 'completed', finishedAt: Date.now(),
      exitCode: args.exit_code, stdout: args.stdout, stderr: args.stderr,
      durationMs: args.duration_ms, outputTruncated: args.output_truncated,
      leaseTokenHash: null, completedLeaseTokenHash: leaseHash, completionHash,
    });
    return { acknowledged: true };
  });
}
