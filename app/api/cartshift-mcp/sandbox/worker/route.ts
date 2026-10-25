import { z } from 'zod';
import { claimPoolJob, poolHeartbeat, poolIdentity, confirmPoolFence, supervisePoolSlot, inspectPoolSlot } from '@/lib/mcp/sandbox-pool';
import {
  authorizeSandboxWorker, completeSandboxJob, leaseSandboxJob, recordSandboxHeartbeat,
  sandboxCancellationRequested,
} from '@/lib/mcp/sandbox-jobs';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 200_000; // Bounded 24KB output can expand sixfold in JSON.

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** HTTPS-only, outbound-polled bridge. No public shell or host-mounted Docker API. */
export async function POST(request: Request) {
  if (!authorizeSandboxWorker(request.headers.get('authorization'))) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) {
    return json({ error: 'request_too_large' }, 413);
  }
  let body: unknown;
  try {
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            return json({ error: 'request_too_large' }, 413);
          }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch { return json({ error: 'invalid_json' }, 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'invalid_request' }, 400);
  }
  const args = body as Record<string, unknown>;
  const version = args.worker_version === undefined ? 2 : args.worker_version;
  if (version === 5) {
    try {
      if (args.action === 'fenced') {
        const parsed = poolIdentity.extend({ action: z.literal('fenced'), worker_version: z.literal(5),
          expected_worker_id: z.string().regex(/^[a-f0-9]{32}$/).nullable() }).strict().parse(args);
        return json(await confirmPoolFence(parsed, parsed.expected_worker_id));
      }
      if (args.action === 'inspect_slot' || args.action === 'supervise') {
        const parsed = poolIdentity.extend({ action: z.enum(['inspect_slot', 'supervise']), worker_version: z.literal(5) }).strict().parse(args);
        return json(await (parsed.action === 'inspect_slot' ? inspectPoolSlot(parsed) : supervisePoolSlot(parsed)));
      }
      if (args.action === 'poll') {
        const parsed = poolIdentity.extend({ action: z.literal('poll'), worker_version: z.literal(5), heartbeat: z.boolean().optional() }).strict().parse(args);
        return json({ job: await claimPoolJob(parsed) });
      }
      if (args.action === 'heartbeat') {
        const parsed = poolIdentity.extend({ action: z.literal('heartbeat'), worker_version: z.literal(5), busy: z.literal(true),
          job_id: z.string().min(12).max(128), lease_token: z.string().min(32).max(128) }).strict().parse(args);
        return json(await poolHeartbeat(parsed, parsed.job_id, parsed.lease_token));
      }
      if (args.action === 'complete') {
        const { action: _action, worker_version: _version, slot, ...completion } = args;
        poolIdentity.parse({ slot, worker_id: args.worker_id });
        return json(await completeSandboxJob(completion));
      }
      return json({ error: 'unknown_action' }, 400);
    } catch (error) { return error instanceof z.ZodError
      ? json({ error: 'invalid_request' }, 400) : json({ error: 'job_operation_failed' }, 409); }
  }
  if (version !== 2 && version !== 3 && version !== 4) return json({ error: 'invalid_worker_version' }, 400);
  const keys = Object.keys(args).filter(key => key !== 'worker_version');
  try {
    if (args.action === 'poll' &&
        (keys.length === 1 || (keys.length === 2 && args.heartbeat === true))) {
      const job = await leaseSandboxJob(version);
      // Heartbeat every ~30s when idle, and whenever the worker begins a job.
      if (job) await recordSandboxHeartbeat(true, version);
      else if (args.heartbeat === true) await recordSandboxHeartbeat(false, version);
      return json({ job });
    }
    if (args.action === 'heartbeat' && args.busy === true && keys.length === 2) {
      return json(await recordSandboxHeartbeat(true, version));
    }
    if (version === 4 && args.action === 'heartbeat' && args.busy === true &&
        keys.length === 4 && typeof args.job_id === 'string' &&
        typeof args.lease_token === 'string') {
      return json({ acknowledged: true,
        cancel_requested: await sandboxCancellationRequested(args.job_id, args.lease_token) });
    }
    if (args.action === 'complete') {
      const { action: _action, worker_version: _version, ...completion } = args;
      void _action;
      void _version;
      return json(await completeSandboxJob(completion));
    }
    return json({ error: 'unknown_action' }, 400);
  } catch {
    return json({ error: 'job_operation_failed' }, 409);
  }
}

export async function GET() {
  return json({ error: 'method_not_allowed' }, 405);
}
