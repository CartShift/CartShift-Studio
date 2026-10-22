import { MCP_ORIGIN, requireMcpToken } from '@/lib/mcp/connection';
import { TOOL_DEFS, callTool } from '@/lib/mcp/tools';

export const runtime = 'nodejs';
// Bounded prospect scans can legitimately take longer than ordinary read tools.
export const maxDuration = 120;

const metadataUrl = MCP_ORIGIN + '/.well-known/oauth-protected-resource';
function reply(id: unknown, result: unknown) {
  return Response.json({ jsonrpc: '2.0', id, result }, {
    headers: { 'Cache-Control': 'no-store', 'MCP-Protocol-Version': '2025-11-25' },
  });
}
function fail(id: unknown, code: number, message: string) {
  return Response.json({ jsonrpc: '2.0', id, error: { code, message } }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

function authenticationRequired(id: unknown, error: 'invalid_token' | 'insufficient_scope', scope?: string) {
  // ChatGPT scans tools before a user connects. Only tool invocations need
  // credentials; this challenge lets ChatGPT offer an OAuth sign-in UI.
  const challenge = 'Bearer resource_metadata="' + metadataUrl + '", error="' + error +
    '", error_description="Connect a CartShift agency account to use this tool"' +
    (scope ? ', scope="' + scope + '"' : '');
  return reply(id, {
    content: [{ type: 'text', text: 'CartShift authentication required.' }],
    isError: true,
    _meta: { 'mcp/www_authenticate': [challenge] },
  });
}

export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 102400) {
    return fail(null, -32600, 'Request too large');
  }
  let body: { id?: unknown; jsonrpc?: string; method?: string; params?: Record<string, unknown> };
  try { body = await request.json(); }
  catch { return fail(null, -32700, 'Parse error'); }
  if (!body || body.jsonrpc !== '2.0' || typeof body.method !== 'string') {
    return fail(body?.id ?? null, -32600, 'Invalid JSON-RPC request');
  }
  if (!('id' in body)) return new Response(null, { status: 202 });

  switch (body.method) {
    case 'initialize':
      return reply(body.id, {
        protocolVersion: '2025-11-25',
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'cartshift', version: '1.0.0' },
        instructions: 'Read existing clients and work items before writing. Do not invent identifiers or completed statuses.',
      });
    case 'ping':
      return reply(body.id, {});
    case 'tools/list':
      return reply(body.id, { tools: TOOL_DEFS.map(tool => ({
        name: tool.name, description: tool.description, inputSchema: tool.inputSchema,
        securitySchemes: [{ type: 'oauth2', scopes: [tool.scope] }],
      })) });
    case 'tools/call': {
      const name = body.params?.name;
      if (typeof name !== 'string') return fail(body.id, -32602, 'Missing tool name');
      const tool = TOOL_DEFS.find(t => t.name === name);
      if (!tool) return fail(body.id, -32601, 'Tool not found');
      // Initialize/tools/list expose only public tool metadata. All data access
      // and mutations require an authenticated agency user and a matching scope.
      let grant;
      try { grant = await requireMcpToken(request.headers.get('authorization')); }
      catch { return authenticationRequired(body.id, 'invalid_token', tool.scope); }
      if (!grant.scope.includes(tool.scope)) {
        return authenticationRequired(body.id, 'insufficient_scope', tool.scope);
      }
      try {
        const result = await callTool(name, body.params?.arguments || {}, grant);
        return reply(body.id, { content: [{ type: 'text', text: JSON.stringify(result) }], isError: false });
      } catch (error) {
        const sandboxErrors: Record<string, string> = {
          SANDBOX_NOT_CONFIGURED: 'SANDBOX_NOT_CONFIGURED: the sandbox owner or worker credential is missing on this deployment.',
          SANDBOX_FORBIDDEN: 'SANDBOX_FORBIDDEN: this account is not the configured sandbox owner.',
          INVALID_WORKDIR: 'INVALID_WORKDIR: choose a directory inside /workspace without traversal.',
          JOB_NOT_FOUND: 'JOB_NOT_FOUND: no sandbox result is available for this owner and job ID.',
        };
        const sandboxMessage = name.startsWith('sandbox_') && error instanceof Error
          ? sandboxErrors[error.message] : undefined;
        const safeMessage = sandboxMessage || (error instanceof Error &&
          (error.name === 'ZodError' || /^(Client not found|Organization not found|Work item not found|Empty |Too many work items|Unknown tool|Arguments)/.test(error.message))
          ? error.message : 'Operation could not be completed; review the client ID, permissions and server logs');
        return reply(body.id, { content: [{ type: 'text', text: safeMessage }], isError: true });
      }
    }
    default:
      return fail(body.id, -32601, 'Method not found');
  }
}
// Streamable HTTP without SSE: let clients fall back from GET to POST.
// OAuth linking is initiated by the tool-level challenge on POST tools/call.
export async function GET() {
  return new Response('MCP uses POST JSON-RPC', {
    status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
  });
}
export async function DELETE() {
  return new Response(null, { status: 405, headers: { Allow: 'POST' } });
}
