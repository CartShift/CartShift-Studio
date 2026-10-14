import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(), get: vi.fn(), upsert: vi.fn(), finding: vi.fn(), contact: vi.fn(), scan: vi.fn(), update: vi.fn(), link: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({ adminDb: null }));
vi.mock('@/lib/services/prospect-scan-service', () => ({ scanProspect: mocks.scan }));
vi.mock('@/lib/services/prospect-sales-server', () => ({ updateProspectSales: mocks.update, linkProspectProposal: mocks.link }));
vi.mock('@/lib/services/prospects-server', () => ({
  listProspects: mocks.list, getProspect: mocks.get,
  upsertProspect: mocks.upsert, addProspectFinding: mocks.finding,
  addProspectContactCandidate: mocks.contact,
}));

import { TOOL_DEFS, callTool } from '@/lib/mcp/tools';

const grant = {
  uid: 'cartshift-owner', clientId: 'chatgpt-app',
  scope: ['prospects:read', 'prospects:write'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
  expiresAt: Date.now() + 60_000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ prospects: [] });
  mocks.upsert.mockResolvedValue({ prospect_id: 'prospect_' + 'a'.repeat(32), created: true });
});

describe('CartShift ChatGPT research connector', () => {
  it('advertises read/write research tools with independent OAuth scopes', () => {
    expect(TOOL_DEFS.filter(tool => tool.name.includes('prospect')).map(tool => [
      tool.name, tool.scope,
    ])).toEqual([
      ['list_prospects', 'prospects:read'],
      ['get_prospect', 'prospects:read'],
      ['upsert_prospect', 'prospects:write'],
      ['add_prospect_finding', 'prospects:write'],
      ['add_prospect_contact_candidate', 'prospects:write'],
      ['update_prospect_sales', 'prospects:write'],
      ['link_prospect_proposal', 'prospects:write'],
      ['scan_prospect', 'prospects:scan'],
    ]);
  });

  it('rejects old client/work grants before touching prospect storage', async () => {
    await expect(callTool('upsert_prospect', {
      store_url: 'https://shop.co.il', source_url: 'https://shop.co.il',
    }, { ...grant, scope: ['clients:read', 'work:write'] }))
      .rejects.toThrow('INSUFFICIENT_SCOPE');
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('requires explicit prospect scan OAuth scope before triggering a site audit', async () => {
    await expect(callTool('scan_prospect', {
      prospect_id: 'prospect_' + 'a'.repeat(32),
    }, grant)).rejects.toThrow('INSUFFICIENT_SCOPE');
    expect(mocks.scan).not.toHaveBeenCalled();
  });

  it('allows candidate insertion and private listing through shared services', async () => {
    const input = { store_url: 'https://shop.co.il', source_url: 'https://shop.co.il' };
    const created = await callTool('upsert_prospect', input, grant);
    expect(created).toEqual({ prospect_id: 'prospect_' + 'a'.repeat(32), created: true });
    expect(mocks.upsert).toHaveBeenCalledWith(input, grant.uid);
    await callTool('list_prospects', { limit: 10 }, grant);
    expect(mocks.list).toHaveBeenCalledWith({ limit: 10 }, grant.uid);
  });
});