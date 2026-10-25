import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/firebase-admin', () => ({ adminDb: null }));
import { POST } from '@/app/api/cartshift-mcp/mcp/route';
import { GET as rootMetadata } from '@/app/.well-known/oauth-protected-resource/route';
import { GET as scopedMetadata } from '@/app/.well-known/oauth-protected-resource/api/cartshift-mcp/mcp/route';
const url = 'https://portal.cart-shift.com/api/cartshift-mcp/mcp';
const request = (method: string, params: unknown = {}, headers: Record<string, string> = {}) => new Request(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
});
describe('MCP client interoperability', () => {
  it.each(['2025-03-26', '2025-06-18', '2025-11-25'])('negotiates the supported client protocol %s', async version => {
    const response = await POST(request('initialize', { protocolVersion: version }));
    expect((await response.json()).result.protocolVersion).toBe(version);
    expect(response.headers.get('MCP-Protocol-Version')).toBe(version);
    expect((await POST(request('ping', {}, { 'MCP-Protocol-Version': version }))).headers.get('MCP-Protocol-Version')).toBe(version);
  });
  it.each([undefined, '2024-11-05', 'unknown-version'])('offers current protocol for unsupported or missing version %s', async version => {
    const response = await POST(request('initialize', { protocolVersion: version }));
    expect((await response.json()).result.protocolVersion).toBe('2025-11-25');
  });
  it('serves identical protected metadata at RFC 9728 scoped and canonical paths', async () => {
    const root = await rootMetadata(); const scoped = await scopedMetadata();
    expect(scoped.status).toBe(200);
    expect(scoped.headers.get('cache-control')).toBe(root.headers.get('cache-control'));
    expect(await scoped.json()).toEqual(await root.json());
  });
  it('keeps owner tools protected for older negotiated protocols', async () => {
    const response = await POST(request('tools/call', { name: 'sandbox_status', arguments: {} }, { 'MCP-Protocol-Version': '2025-03-26' }));
    const result = (await response.json()).result;
    expect(result.isError).toBe(true);
    expect(result._meta['mcp/www_authenticate'][0]).toContain('invalid_token');
    expect(response.headers.get('MCP-Protocol-Version')).toBe('2025-03-26');
    expect(result.content[0].text).not.toContain('connected');
  });
  it('defaults a missing subsequent-request header to March 2025', async () => {
    const response = await POST(request('ping'));
    expect(response.headers.get('MCP-Protocol-Version')).toBe('2025-03-26');
  });
  it.each(['unknown', '2024-11-05', ''])('rejects unsupported protocol header %s', async version => {
    const response = await POST(request('ping', {}, { 'MCP-Protocol-Version': version }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Unsupported MCP protocol version' });
  });
  it('rejects unsupported headers on notifications before returning 202', async () => {
    const response = await POST(new Request(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'MCP-Protocol-Version': 'invalid' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    }));
    expect(response.status).toBe(400);
  });
});
