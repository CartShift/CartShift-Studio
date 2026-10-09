import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orgGet: vi.fn(),
  projectGet: vi.fn(),
  requestGet: vi.fn(),
  txUpdate: vi.fn(),
  txCreate: vi.fn(),
  transactionGet: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: () => ({
        id: 'generated-id',
        get: name === 'portal_organizations' ? mocks.orgGet :
          name === 'portal_projects' ? mocks.projectGet : mocks.requestGet,
      }),
    }),
    runTransaction: (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ get: mocks.transactionGet, update: mocks.txUpdate, create: mocks.txCreate }),
  },
}));

import { callTool, TOOL_DEFS } from '@/lib/mcp/tools';

const grant = {
  uid: 'agency-user', clientId: 'chatgpt-client',
  scope: ['clients:read', 'clients:write', 'work:read', 'work:write'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
  expiresAt: Date.now() + 60_000,
};

describe('CartShift expanded MCP operations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.orgGet.mockResolvedValue({
      exists: true, data: () => ({ status: 'active' }),
    });
  });

  it('advertises agency projects, proposals, conversations and consultations with OAuth scopes', () => {
    for (const name of ['list_projects', 'get_project', 'create_project', 'update_project',
      'add_project_blocker', 'resolve_project_blocker', 'add_project_update',
      'link_work_item_to_project', 'list_proposals', 'get_proposal',
      'list_consultations', 'get_consultation', 'list_client_activity',
      'list_work_item_comments']) {
      expect(TOOL_DEFS.find(tool => tool.name === name)?.scope).toMatch(/^work:(read|write)$/);
    }
    expect(TOOL_DEFS).toHaveLength(21);
  });

  it('rejects reading a project from a different client', async () => {
    mocks.projectGet.mockResolvedValue({
      exists: true, data: () => ({ orgId: 'other_org', title: 'Private project' }),
    });
    await expect(callTool('get_project', { org_id: 'arava_org', project_id: 'private_project' }, grant))
      .rejects.toThrow('Project not found for this client');
  });

  it('rejects reading proposals from a different client', async () => {
    mocks.requestGet.mockResolvedValue({
      exists: true, data: () => ({ orgId: 'other_org', title: 'Private quote', isBillable: true }),
    });
    await expect(callTool('get_proposal', { org_id: 'arava_org', proposal_id: 'private_proposal' }, grant))
      .rejects.toThrow('Work item not found for this client');
  });

  it('does not disclose public quote tokens, payment IDs or signature IP', async () => {
    mocks.requestGet.mockResolvedValue({
      exists: true, data: () => ({
        orgId: 'arava_org', isBillable: true, status: 'QUOTED', totalAmount: 130000,
        publicToken: 'secret', paymentIds: ['private'], acceptedIp: '127.0.0.1',
      }),
    });
    const result = await callTool('get_proposal', {
      org_id: 'arava_org', proposal_id: 'a_commercial_quote',
    }, grant) as Record<string, unknown>;
    expect(result.totalAmount).toBe(130000);
    expect(result).not.toHaveProperty('publicToken');
    expect(result).not.toHaveProperty('paymentIds');
    expect(result).not.toHaveProperty('acceptedIp');
  });

  it('enforces work:read authorization before reading projects', async () => {
    await expect(callTool('get_project',
      { org_id: 'arava_org', project_id: 'arava_project' },
      { ...grant, scope: ['clients:read'] })).rejects.toThrow('INSUFFICIENT_SCOPE');
    expect(mocks.orgGet).not.toHaveBeenCalled();
  });

  it('disallows changing commercial request statuses through ordinary task updates', async () => {
    mocks.orgGet.mockResolvedValue({
      exists: true, data: () => ({ status: 'active' }),
    });
    mocks.transactionGet.mockResolvedValue({
      exists: true,
      data: () => ({ orgId: 'arava_org', title: 'Priced quote', isBillable: true }),
    });
    await expect(callTool('update_work_item', {
      org_id: 'arava_org', work_item_id: 'commercial_request',
      patch: { status: 'IN_PROGRESS' },
    }, grant)).rejects.toThrow('Commercial work items must use the proposal workflow');
    expect(mocks.txUpdate).not.toHaveBeenCalled();
  });

  it('rejects a forged payment-status transition on a normal request', async () => {
    await expect(callTool('update_work_item', {
      org_id: 'arava_org', work_item_id: 'normal_request',
      patch: { status: 'PAID' },
    }, grant)).rejects.toThrow();
    expect(mocks.txUpdate).not.toHaveBeenCalled();
  });

  it('does not allow an MCP caller to mark an unverified project completed', async () => {
    await expect(callTool('update_project', {
      org_id: 'arava_org', project_id: 'arava_project',
      patch: { status: 'completed' },
    }, grant)).rejects.toThrow();
    expect(mocks.txUpdate).not.toHaveBeenCalled();
  });
});
