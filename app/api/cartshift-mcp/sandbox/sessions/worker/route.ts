import { authorizeSandboxWorker } from '@/lib/mcp/sandbox-jobs';
import { syncSandboxSessions } from '@/lib/mcp/sandbox-sessions';

export const runtime = 'nodejs';
const MAX_BODY_BYTES = 160_000; // 24KB tail plus worst-case JSON escaping.
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function POST(request: Request) {
  if (!authorizeSandboxWorker(request.headers.get('authorization')))
    return json({ error: 'unauthorized' }, 401);
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES)
    return json({ error: 'request_too_large' }, 413);
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
      } finally {
        reader.releaseLock();
      }
    }
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)));
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  try {
    return json(await syncSandboxSessions(body));
  } catch {
    return json({ error: 'session_operation_failed' }, 409);
  }
}
export async function GET() {
  return json({ error: 'method_not_allowed' }, 405);
}
