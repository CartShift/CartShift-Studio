import {
  authorizeSandboxWorker, completeSandboxJob, leaseSandboxJob,
} from '@/lib/mcp/sandbox-jobs';

export const runtime = 'nodejs';

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** HTTPS-only, outbound-polled bridge. No public shell or host-mounted Docker API. */
export async function POST(request: Request) {
  if (!authorizeSandboxWorker(request.headers.get('authorization'))) {
    return json({ error: 'unauthorized' }, 401);
  }
  if (Number(request.headers.get('content-length') || 0) > 55_000) {
    return json({ error: 'request_too_large' }, 413);
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ error: 'invalid_json' }, 400); }
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
    // Never leak environment, tokens, command contents, Firestore internals.
    return json({ error: 'job_operation_failed' }, 409);
  }
}

export async function GET() {
  return json({ error: 'method_not_allowed' }, 405);
}
