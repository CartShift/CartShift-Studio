import { MCP_ORIGIN, MCP_RESOURCE, MCP_SCOPES } from '@/lib/mcp/connection';

export async function GET() {
  return Response.json({
    resource: MCP_RESOURCE,
    authorization_servers: [MCP_ORIGIN],
    scopes_supported: MCP_SCOPES,
    bearer_methods_supported: ['header'],
  }, { headers: { 'Cache-Control': 'public, max-age=300' } });
}
