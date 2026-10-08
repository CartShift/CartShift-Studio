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

  it('challenges unauthenticated MCP traffic before processing JSON-RPC', async () => {
    const response = await POST(new Request('https://portal.cart-shift.com/api/cartshift-mcp/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    }));
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain('resource_metadata=');
  });
});
