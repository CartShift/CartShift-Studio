import 'server-only';

import { randomUUID } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { AUDIT, firestore, may, tokenHash, type TokenGrant } from '@/lib/mcp/connection';
import { authorizeSandboxOwner } from '@/lib/mcp/sandbox-jobs';

const COLLECTION = 'sandbox_auth_sessions';
const FRESH_MS = 90_000;
const terminal = new Set(['completed', 'failed', 'stopped', 'expired', 'worker_lost']);
const uuid = z.string().uuid();
const statuses = z.enum([
  'pending',
  'running',
  'waiting_for_input',
  'stop_requested',
  'completed',
  'failed',
  'stopped',
  'expired',
  'worker_lost',
]);
const startSchema = z
  .object({
    provider: z.enum(['supabase', 'github', 'vercel', 'firebase', 'shopify', 'northflank', 'apps-script']),
    cwd: z
      .string()
      .max(300)
      .regex(/^\/workspace(?:\/[A-Za-z0-9._/-]+)?$/)
      .default('/workspace'),
    ttl_seconds: z.number().int().min(60).max(900).default(600),
    idle_timeout_seconds: z.number().int().min(30).max(300).default(180),
  })
  .strict();
const inputSchema = z
  .object({
    session_id: uuid,
    input_type: z.enum(['confirm', 'verification_code']),
    input: z.string().max(512),
  })
  .strict();
const snapshotSchema = z
  .object({
    session_id: uuid,
    status: statuses,
    output: z.string().max(24_000),
    output_start: z.number().int().nonnegative().safe(),
    cursor: z.number().int().nonnegative().safe(),
    exit_code: z.number().int().min(-255).max(255).nullable(),
    reason: z
      .enum([
        'exit',
        'stopped',
        'ttl_expired',
        'idle_expired',
        'output_flood',
        'guardian_lost',
        'invalid_request',
        'worker_restarted',
      ])
      .nullable(),
    ack_input_id: uuid.nullable(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (
      Buffer.byteLength(s.output, 'utf8') > 24_000 ||
      s.cursor - s.output_start !== [...s.output].length
    ) {
      ctx.addIssue({ code: 'custom', message: 'INVALID_OUTPUT_SPAN' });
    }
  });
const syncSchema = z
  .object({
    action: z.literal('sync'),
    version: z.literal(3),
    epoch: uuid,
    session: snapshotSchema.nullable(),
  })
  .strict();
type Data = FirebaseFirestore.DocumentData;

function refs() {
  const db = firestore();
  return {
    db,
    sessions: db.collection(COLLECTION),
    control: db.collection(COLLECTION).doc('control'),
  };
}
function fresh(data: Data | undefined, now = Date.now()) {
  return (
    data?.version === 3 &&
    typeof data.epoch === 'string' &&
    typeof data.lastSeenAt === 'number' &&
    now >= data.lastSeenAt &&
    now - data.lastSeenAt < FRESH_MS
  );
}
function expiry(data: Data, now: number) {
  return !terminal.has(data.status) && (now >= data.expiresAt || now >= data.idleDeadlineAt);
}
function expired(data: Data, now: number): Data {
  return {
    ...data,
    status: 'expired',
    reason: now >= data.expiresAt ? 'ttl_expired' : 'idle_expired',
    finishedAt: now,
    pendingInput: null,
  };
}
function publicResult(id: string, data: Data, cursor = 0) {
  const points = [...(data.output || '')];
  const from = Math.max(cursor, data.outputStart || 0);
  return {
    session_id: id,
    provider: data.provider,
    status: data.status,
    created_at: data.createdAt,
    expires_at: data.expiresAt,
    idle_deadline_at: data.idleDeadlineAt,
    output: points.slice(Math.max(0, from - (data.outputStart || 0))).join(''),
    output_start: Math.min(from, data.cursor || 0),
    cursor: data.cursor || 0,
    output_truncated: cursor < (data.outputStart || 0),
    cursor_reset: cursor > (data.cursor || 0),
    exit_code: data.exitCode ?? null,
    reason: data.reason ?? null,
    input_pending: !!data.pendingInput,
  };
}
function audit(tx: FirebaseFirestore.Transaction, uid: string, action: string, targetId: string) {
  tx.create(firestore().collection(AUDIT).doc(), { uid, action, targetId, at: Date.now() });
}
export async function hasFreshSandboxSessionsHandshake() {
  return fresh((await refs().control.get()).data());
}
export function redactSessionOutput(value: string, oneTimeInput?: string): string {
  const mask = (s: string) => '*'.repeat([...s].length);
  // Strip ANSI for matching, but preserve the worker's original code-point span.
  // This also detects a token whose characters were separated by color codes.
  // eslint-disable-next-line no-control-regex -- terminal escape sequences must be masked.
  const escapes = [...value.matchAll(/\x1b(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]*(?:\x07|$))/g)];
  const original: string[] = [];
  const mapping: number[] = [];
  let clean = '';
  let escapeIndex = 0;
  for (let index = 0; index < value.length; ) {
    const escape = escapes[escapeIndex];
    if (escape && escape.index === index) {
      original.push(...[...escape[0]].map(() => '*'));
      index += escape[0].length;
      escapeIndex++;
    } else {
      const point = String.fromCodePoint(value.codePointAt(index)!);
      mapping.push(original.length);
      original.push(point);
      clean += point;
      index += point.length;
    }
  }
  let result = clean
    .replace(
      /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
      mask
    )
    .replace(
      /\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+|ya29\.[A-Za-z0-9._-]+|sbp_[A-Za-z0-9_]+|sb_secret_[A-Za-z0-9_-]+|shp(?:at|ca|ss|pa)_[A-Za-z0-9_-]+|vcp_[A-Za-z0-9_-]+|1\/\/[A-Za-z0-9_-]{15,}|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\b/g,
      mask
    )
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/-]{8,}={0,2}/gi, s => mask(s))
    .replace(
      /((?:access_token|refresh_token|client_secret|private_key|api_key|FIREBASE_TOKEN)(?:\\?["'])?\s*[:=]\s*(?:\\?["'])?)[^\s"'\\,}]+/gi,
      mask
    )
    .replace(/\b4\/[A-Za-z0-9._~-]+/g, mask);
  if (oneTimeInput && oneTimeInput.length > 1)
    result = result.split(oneTimeInput).join(mask(oneTimeInput));
  [...result].forEach((point, index) => {
    if (point === '*') original[mapping[index]] = '*';
  });
  return original.join('');
}
export async function startSandboxSession(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  may(grant, 'work:write');
  const args = startSchema.parse(input);
  if (args.cwd.split('/').some(s => s === '.' || s === '..')) throw new Error('INVALID_WORKDIR');
  const { db, sessions, control } = refs();
  const sessionId = randomUUID();
  const ref = sessions.doc(sessionId);
  return db.runTransaction(async tx => {
    const now = Date.now();
    const state = (await tx.get(control)).data();
    const previous = state?.activeSessionId
      ? (await tx.get(sessions.doc(state.activeSessionId))).data()
      : undefined;
    if (!fresh(state, now)) throw new Error('SANDBOX_SESSIONS_WORKER_UNAVAILABLE');
    if (previous && !terminal.has(previous.status) && !expiry(previous, now))
      throw new Error('SANDBOX_SESSION_ACTIVE');
    if (previous && expiry(previous, now))
      tx.update(sessions.doc(state!.activeSessionId), expired(previous, now));
    const data = {
      ownerUid: grant.uid,
      provider: args.provider,
      cwd: args.cwd,
      epoch: state!.epoch,
      ttlSeconds: args.ttl_seconds,
      idleTimeoutSeconds: args.idle_timeout_seconds,
      status: 'pending',
      createdAt: now,
      expiresAt: now + args.ttl_seconds * 1000,
      idleDeadlineAt: now + args.idle_timeout_seconds * 1000,
      purgeAt: Timestamp.fromMillis(now + args.ttl_seconds * 1000 + 3_600_000),
      output: '',
      outputStart: 0,
      cursor: 0,
      exitCode: null,
      reason: null,
      pendingInput: null,
    };
    tx.create(ref, data);
    tx.set(control, { activeSessionId: sessionId }, { merge: true });
    audit(tx, grant.uid, 'sandbox_session_start', sessionId);
    return publicResult(sessionId, data);
  });
}
async function ownedSession<T>(
  grant: TokenGrant,
  sessionId: string,
  operation: (
    data: Data,
    tx: FirebaseFirestore.Transaction,
    ref: FirebaseFirestore.DocumentReference,
    now: number
  ) => T
) {
  const { db, sessions } = refs();
  const ref = sessions.doc(sessionId);
  return db.runTransaction(async tx => {
    const original = (await tx.get(ref)).data();
    const now = Date.now();
    if (!original || original.ownerUid !== grant.uid) throw new Error('SANDBOX_SESSION_NOT_FOUND');
    const data = expiry(original, now) ? expired(original, now) : original;
    if (data !== original) {
      tx.update(ref, data);
      audit(tx, grant.uid, 'sandbox_session_expired', sessionId);
    }
    return operation(data, tx, ref, now);
  });
}
export async function readSandboxSession(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  may(grant, 'work:read');
  const args = z
    .object({ session_id: uuid, cursor: z.number().int().nonnegative().safe().default(0) })
    .strict()
    .parse(input);
  return ownedSession(grant, args.session_id, data =>
    publicResult(args.session_id, data, args.cursor)
  );
}
export async function sendSandboxSessionInput(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  may(grant, 'work:write');
  const args = inputSchema.parse(input);
  return ownedSession(grant, args.session_id, (data, tx, ref, now) => {
    if (terminal.has(data.status) || data.status === 'stop_requested')
      throw new Error('SANDBOX_SESSION_CLOSED');
    if (data.pendingInput) {
      if (
        data.pendingInput.input_type === args.input_type &&
        data.pendingInput.input === args.input
      )
        return {
          session_id: args.session_id,
          input_id: data.pendingInput.input_id,
          accepted: true,
        };
      throw new Error('SANDBOX_SESSION_INPUT_PENDING');
    }
    if (
      /(?:gh[pousr]_|github_pat_|sbp_|sb_secret_|shp(?:at|ca|ss|pa)_|vcp_|1\/\/|ya29\.|eyJ[A-Za-z0-9_-]*\.)/.test(
        args.input
      )
    )
      throw new Error('SANDBOX_SESSION_INVALID_INPUT');
    // eslint-disable-next-line no-control-regex -- reject terminal control input.
    if (/[\r\n\x00-\x1f\x7f]/.test(args.input)) throw new Error('SANDBOX_SESSION_INVALID_INPUT');
    const allowed =
      args.input_type === 'confirm'
        ? /^(?:y|yes|n|no)?$/i.test(args.input)
        : data.provider === 'supabase'
          ? /^[0-9a-f]{8}$/i.test(args.input)
          : (data.provider === 'firebase' || data.provider === 'apps-script') && /^4\/[A-Za-z0-9._~-]+$/.test(args.input);
    if (!allowed) throw new Error('SANDBOX_SESSION_INVALID_INPUT');
    const verificationHash = args.input_type === 'verification_code' ? tokenHash(args.input) : null;
    if (verificationHash && data.lastVerificationHash === verificationHash)
      return {
        session_id: args.session_id,
        input_id: data.lastVerificationInputId,
        accepted: true,
      };
    const inputId = randomUUID();
    tx.update(ref, {
      ...(verificationHash
        ? { lastVerificationHash: verificationHash, lastVerificationInputId: inputId }
        : {}),
      pendingInput: { input_id: inputId, input_type: args.input_type, input: args.input },
      idleDeadlineAt: Math.min(data.expiresAt, now + data.idleTimeoutSeconds * 1000),
    });
    audit(tx, grant.uid, 'sandbox_session_input', args.session_id);
    return { session_id: args.session_id, input_id: inputId, accepted: true };
  });
}
export async function stopSandboxSession(grant: TokenGrant, input: unknown) {
  authorizeSandboxOwner(grant);
  may(grant, 'work:write');
  const { session_id } = z.object({ session_id: uuid }).strict().parse(input);
  return ownedSession(grant, session_id, (data, tx, ref, now) => {
    if (data.status === 'pending') {
      tx.update(ref, { status: 'stopped', reason: 'stopped', finishedAt: now, pendingInput: null });
      audit(tx, grant.uid, 'sandbox_session_stop', session_id);
      return { session_id, status: 'stopped' };
    }
    if (!terminal.has(data.status)) {
      tx.update(ref, { status: 'stop_requested', pendingInput: null });
      audit(tx, grant.uid, 'sandbox_session_stop', session_id);
    }
    return { session_id, status: terminal.has(data.status) ? data.status : 'stop_requested' };
  });
}
export async function syncSandboxSessions(input: unknown) {
  const args = syncSchema.parse(input);
  if (!process.env.SANDBOX_OWNER_UID) throw new Error('SANDBOX_NOT_CONFIGURED');
  const { db, sessions, control } = refs();
  return db.runTransaction(async tx => {
    const now = Date.now();
    const state = (await tx.get(control)).data();
    const activeId = state?.activeSessionId;
    const ref = activeId ? sessions.doc(activeId) : null;
    let data = ref ? (await tx.get(ref)).data() : undefined;
    const previousStatus = data?.status;
    if (state?.epoch && state.epoch !== args.epoch && fresh(state, now))
      throw new Error('SANDBOX_SESSION_EPOCH_CONFLICT');
    if (data && data.ownerUid !== process.env.SANDBOX_OWNER_UID)
      throw new Error('SANDBOX_SESSION_OWNER_MISMATCH');
    if (data && state?.epoch !== args.epoch && !terminal.has(data.status)) {
      data = {
        ...data,
        status: 'expired',
        reason: 'worker_restarted',
        pendingInput: null,
        finishedAt: now,
      };
    } else if (data && expiry(data, now)) data = expired(data, now);
    const snapshot = args.session;
    if (
      data &&
      snapshot &&
      snapshot.session_id === activeId &&
      data.epoch === args.epoch &&
      !terminal.has(data.status)
    ) {
      const pending = data.pendingInput;
      if (snapshot.cursor >= data.cursor) {
        data = {
          ...data,
          output: redactSessionOutput(snapshot.output, pending?.input),
          outputStart: snapshot.output_start,
          cursor: snapshot.cursor,
          exitCode: snapshot.exit_code,
          reason: snapshot.reason,
          status:
            data.status === 'stop_requested' && !terminal.has(snapshot.status)
              ? 'stop_requested'
              : snapshot.status,
        };
      }
      if (pending && snapshot.ack_input_id === pending.input_id) data.pendingInput = null;
      if (terminal.has(data.status)) {
        data.pendingInput = null;
        data.finishedAt = now;
      }
    }
    if (ref && data) {
      tx.update(ref, data);
      if (previousStatus && !terminal.has(previousStatus) && terminal.has(data.status))
        audit(tx, data.ownerUid, `sandbox_session_${data.status}`, activeId);
    }
    tx.set(
      control,
      {
        epoch: args.epoch,
        version: 3,
        lastSeenAt: now,
        activeSessionId: data && !terminal.has(data.status) ? activeId : null,
      },
      { merge: true }
    );
    if (!data || terminal.has(data.status)) return { session: null };
    return {
      session: {
        session_id: activeId,
        provider: data.provider,
        cwd: data.cwd,
        ttl_seconds: data.ttlSeconds,
        idle_timeout_seconds: data.idleTimeoutSeconds,
        expires_at: data.expiresAt,
        status: data.status,
        pending_input: data.pendingInput ?? null,
      },
    };
  });
}
