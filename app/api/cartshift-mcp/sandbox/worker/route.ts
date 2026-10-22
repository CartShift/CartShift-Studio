import {
  authorizeSandboxWorker, completeSandboxJob, leaseSandboxJob,
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
  try {
    if (args.action === 'poll' && Object.keys(args).length === 1) {
      return json({ job: await leaseSandboxJob() });
    }
    if (args.action === 'complete') {
      const { action: _action, ...completion } = args;
      void _action;
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
