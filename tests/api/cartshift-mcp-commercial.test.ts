import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orgGet: vi.fn(),
  projectGet: vi.fn(),
  proposalGet: vi.fn(),
  requestGet: vi.fn(),
  requestList: vi.fn(),
  transactionGet: vi.fn(),
  txCreate: vi.fn(),
  txUpdate: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => ({
        id: id || 'new-id',
        get: name === 'portal_organizations' ? mocks.orgGet :
          name === 'portal_projects' ? mocks.projectGet : mocks.proposalGet,
      }),
      where: () => ({ limit: () => ({ get: mocks.requestList }) }),
    }),
    runTransaction: (callback: (tx: unknown) => Promise<unknown>) =>
      callback({ get: mocks.transactionGet, create: mocks.txCreate, update: mocks.txUpdate }),
  },
}));

import { callCommercialTool, COMMERCIAL_TOOL_DEFS } from '@/lib/mcp/commercial-tools';

const grant = {
  uid: 'agency-actor', clientId: 'chatgpt-client',
  scope: ['work:read', 'work:write'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
  expiresAt: Date.now() + 90_000,
};
const orgId = 'arava_org';
const projectId = 'arava_project';
const common = {
  org_id: orgId, project_id: projectId, title: 'Arava existing quote',
  objective: 'Introduce Shopify Blackwood food catalog.',
  scope_sections: [{ title: 'Catalog', description: 'Products and collections' }],
  min_hours: 12, max_hours: 16, hourly_rate_minor: 25000,
  currency: 'ILS', tax_rate: 0, deposit_percent: 50,
  terms: 'Deposit 50%, remaining within 7 business days of completion.',
  source_url: 'https://docs.google.com/document/d/source-proposal/edit',
  external_invoice_reference: '10002',
  reported_deposit_minor: 200000,
  reported_deposit_date: '2026-09-15',
  agency_notes: 'Client reported transfer; account reconciliation pending.',
};

describe('CartShift MCP commercial safety', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.orgGet.mockResolvedValue({ exists: true, data: () => ({ status: 'active' }) });
    mocks.projectGet.mockResolvedValue({
      exists: true, data: () => ({ orgId, scope: { minHours: 0, maxHours: 0 } }),
    });
    mocks.proposalGet.mockResolvedValue({ exists: true, data: () => ({
      orgId, isBillable: true, totalAmount: 400000, amountPaid: 0,
      reportedDepositMinor: 200000, reportedDepositStatus: 'client_reported_unverified',
      reportedDepositDate: '2026-09-15', depositAmount: 200000,
      externalInvoiceReference: '10002',
    }) });
    mocks.requestList.mockResolvedValue({ size: 0, docs: [] });
    mocks.transactionGet.mockResolvedValue({ exists: false, data: () => ({}) });
  });

  it('exposes six scoped tools for project details and payment reconciliation', () => {
    expect(COMMERCIAL_TOOL_DEFS).toHaveLength(6);
    expect(COMMERCIAL_TOOL_DEFS.find(x => x.name === 'get_proposal_reconciliation')?.scope).toBe('work:read');
    expect(COMMERCIAL_TOOL_DEFS.find(x => x.name === 'import_proposal_draft')?.scope).toBe('work:write');
  });

  it('rejects importing a proposal under another organization project', async () => {
    mocks.projectGet.mockResolvedValue({
      exists: true, data: () => ({ orgId: 'different_org' }),
    });
    await expect(callCommercialTool('import_proposal_draft', common, grant))
      .rejects.toThrow('Project not found for this client');
    expect(mocks.txCreate).not.toHaveBeenCalled();
  });

  it('rejects an invalid budget before any write', async () => {
    await expect(callCommercialTool('import_proposal_draft',
      { ...common, min_hours: 20, max_hours: 16 }, grant)).rejects.toThrow('Invalid project hours range');
    expect(mocks.txCreate).not.toHaveBeenCalled();
  });

  it('requires the write scope for proposal imports', async () => {
    await expect(callCommercialTool('import_proposal_draft', common,
      { ...grant, scope: ['work:read'] })).rejects.toThrow('INSUFFICIENT_SCOPE');
    expect(mocks.orgGet).not.toHaveBeenCalled();
  });

  it('writes an unsent, unaccepted quote with zero VERIFIED payments', async () => {
    mocks.transactionGet.mockImplementation(async (ref: { id?: string }) => {
      return ref.id === projectId ? {
        exists: true, data: () => ({ orgId }),
      } : { exists: false, data: () => null };
    });
    const response = await callCommercialTool('import_proposal_draft', common, grant) as Record<string, unknown>;
    expect(response.created).toBe(true);
    expect(response.verified_paid_minor).toBe(0);
    const data = mocks.txCreate.mock.calls.find(call =>
      call[1]?.status === 'DRAFT' && call[1]?.isBillable)?.[1];
    expect(data).toMatchObject({
      projectId, status: 'DRAFT', publicAccessEnabled: false, amountPaid: 0,
      totalAmount: 400000, depositAmount: 200000, balanceDue: 400000,
      reportedDepositMinor: 200000, reportedDepositStatus: 'client_reported_unverified',
    });
    expect(data).not.toHaveProperty('sentAt');
    expect(data).not.toHaveProperty('acceptedAt');
  });

  it('reconciliation keeps reported funds separate from verified balances', async () => {
    const response = await callCommercialTool('get_proposal_reconciliation', {
      org_id: orgId, proposal_id: 'arava_quote',
    }, grant) as Record<string, unknown>;
    expect(response.verified_paid_minor).toBe(0);
    expect(response.reported_deposit_minor).toBe(200000);
    expect(response.unverified_estimated_remaining_minor).toBe(200000);
    expect(response.canonical_balance_due_minor).toBe(400000);
  });

  it('does not allow changing a verified client-sign-off checklist entry', async () => {
    mocks.transactionGet.mockResolvedValue({
      exists: true, data: () => ({ orgId, inputs: [],
        launchChecks: [{ id: 'check-signoff', title: 'אישור הלקוח', done: false }] }),
    });
    await expect(callCommercialTool('set_project_checklist_item', {
      org_id: orgId, project_id: projectId,
      field: 'launchChecks', item_id: 'check-signoff', done: true,
    }, grant)).rejects.toThrow('Client sign-off requires manual evidence');
    expect(mocks.txUpdate).not.toHaveBeenCalled();
  });
});
