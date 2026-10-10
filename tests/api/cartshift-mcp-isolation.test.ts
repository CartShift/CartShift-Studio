import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orgGet: vi.fn(),
  requestGet: vi.fn(),
  txUpdate: vi.fn(),
  txCreate: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: () => ({
        get: name === 'portal_organizations' ? mocks.orgGet : mocks.requestGet,
      }),
    }),
    runTransaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ get: mocks.requestGet, update: mocks.txUpdate, create: mocks.txCreate }),
  },
}));

import { callTool } from '@/lib/mcp/tools';
import { agencyActor } from '@/lib/mcp/connection';
import { POST } from '@/app/api/cartshift-mcp/mcp/route';

const grant = {
  uid: 'agency-user',
  clientId: 'chatgpt-client',
  scope: ['clients:read', 'clients:write', 'work:read', 'work:write'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
  expiresAt: Date.now() + 60_000,
};

describe('CartShift MCP tenant isolation', () => {
  it('rejects a work item owned by a different organization', async () => {
    mocks.orgGet.mockResolvedValue({ exists: true, data: () => ({ status: 'active' }) });
    mocks.requestGet.mockResolvedValue({
      exists: true, data: () => ({ orgId: 'other_org', title: 'Private' }),
    });
    await expect(callTool('get_work_item',
      { org_id: 'allowed_org', work_item_id: 'different_work' }, grant))
      .rejects.toThrow('Work item not found for this client');
  });

  it('does not execute a scoped write without the write scope', async () => {
    const readOnly = { ...grant, scope: ['work:read'] };
    await expect(callTool('update_work_item', {
      org_id: 'allowed_org', work_item_id: 'different_work', patch: { status: 'CLOSED' },
    }, readOnly)).rejects.toThrow('INSUFFICIENT_SCOPE');
    expect(mocks.txUpdate).not.toHaveBeenCalled();
  });

  it('denies agency access after account suspension', async () => {
    mocks.requestGet.mockResolvedValue({
      exists: true, data: () => ({ accountType: 'AGENCY', agencyRole: 'owner', status: 'suspended' }),
    });
    await expect(agencyActor('agency-user')).rejects.toThrow('FORBIDDEN');
  });

  it('allows public MCP initialization and tool discovery without accessing tenant data', async () => {
    mocks.orgGet.mockClear();
    mocks.requestGet.mockClear();
    for (const method of ['initialize', 'tools/list'] as const) {
      const response = await POST(new Request('https://portal.cart-shift.com/api/cartshift-mcp/mcp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method,
          ...(method === 'initialize' ? { params: { protocolVersion: '2025-11-25' } } : {}),
        }),
      }));
      expect(response.status).toBe(200);
      const payload = await response.json();
      if (method === 'tools/list') {
        expect(payload.result.tools.find((tool: { name: string }) => tool.name === 'list_clients')
          .securitySchemes).toEqual([{ type: 'oauth2', scopes: ['clients:read'] }]);
      } else {
        expect(payload.result.serverInfo.name).toBe('cartshift');
      }
    }
    expect(mocks.orgGet).not.toHaveBeenCalled();
    expect(mocks.requestGet).not.toHaveBeenCalled();
  });

  it('returns OAuth challenge metadata without executing unauthenticated tools', async () => {
    for (const authorization of [undefined, 'Bearer invalid']) {
      mocks.orgGet.mockClear();
      mocks.requestGet.mockClear();
      const response = await POST(new Request('https://portal.cart-shift.com/api/cartshift-mcp/mcp', {
        method: 'POST', headers: {
          'Content-Type': 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
        },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 7, method: 'tools/call',
          params: { name: 'list_clients', arguments: {} },
        }),
      }));
      expect(response.status).toBe(200);
      const result = (await response.json()).result;
      expect(result.isError).toBe(true);
      const challenge = result._meta['mcp/www_authenticate'][0] as string;
      expect(challenge).toContain('resource_metadata="https://portal.cart-shift.com/.well-known/oauth-protected-resource"');
      expect(challenge).toContain('error="invalid_token"');
      expect(challenge).toContain('error_description=');
      expect(mocks.orgGet).not.toHaveBeenCalled();
      expect(mocks.requestGet).not.toHaveBeenCalled();
    }
  });
});
