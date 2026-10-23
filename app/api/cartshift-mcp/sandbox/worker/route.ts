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
