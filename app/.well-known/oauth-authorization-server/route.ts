import { MCP_ORIGIN, MCP_SCOPES } from '@/lib/mcp/connection';

export async function GET() {
  const base = MCP_ORIGIN + '/api/cartshift-mcp/oauth';
  return Response.json({
    issuer: MCP_ORIGIN,
    authorization_endpoint: base + '/authorize',
    token_endpoint: base + '/token',
    registration_endpoint: base + '/register',
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [...MCP_SCOPES, 'offline_access'],
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
