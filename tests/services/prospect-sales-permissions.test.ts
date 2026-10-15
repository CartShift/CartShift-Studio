import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  role: 'business_development',
  transactionCalls: 0,
  updates: [] as Array<{ path: string; patch: Record<string, unknown> }>,
}));
const data = vi.hoisted(() => new Map<string, Record<string, unknown>>());
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => new Date('2026-10-16T08:00:00Z') },
}));
vi.mock('@/lib/services/prospects-server', () => ({
  requireProspectActor: async (uid: string) => ({ uid, role: state.role }),
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (collection: string) => ({
      doc: (id = 'event') => ({ id, path: collection + '/' + id }),
    }),
    runTransaction: async (fn: (tx: {
      get: (ref: { path: string }) => Promise<unknown>;
      update: (ref: { path: string }, patch: Record<string, unknown>) => void;
      create: (ref: { path: string }, payload: Record<string, unknown>) => void;
    }) => Promise<unknown>) => {
      state.transactionCalls++;
      return fn({
        get: async ref => ({ exists: data.has(ref.path), data: () => data.get(ref.path) }),
        update: (ref, patch) => {
          state.updates.push({ path: ref.path, patch });
          data.set(ref.path, { ...data.get(ref.path), ...patch });
        },
        create: (_ref, _payload) => {},
      });
    },
  },
}));

import { updateProspectSales, linkProspectProposal } from '@/lib/services/prospect-sales-server';
const prospectId = 'prospect_' + 'a'.repeat(32);
const orgId = 'org_real_store';
const quoteId = 'req_real_quote';
const storePath = 'agency_prospects/' + prospectId;

beforeEach(() => {
  data.clear(); state.role = 'business_development'; state.transactionCalls = 0; state.updates = [];
  data.set(storePath, {
    canonicalDomain: 'shop.co.il', technicalStatus: 'approved',
    stage: 'qualified', outreachEligibility: 'review_required', doNotContact: false,
  });
  data.set('portal_organizations/' + orgId, { website: 'https://shop.co.il', status: 'active' });
  data.set('portal_requests/' + quoteId, { orgId, isBillable: true, status: 'QUOTED' });
});

describe('commercial transitions cannot be fabricated by sales staff', () => {
  it('rejects direct founder-only commercial linking before reading a request', async () => {
    await expect(linkProspectProposal(prospectId, orgId, quoteId,
      'The official domain and the client match.', 'adi')).rejects.toThrow('FOUNDER_REVIEW_REQUIRED');
    expect(state.transactionCalls).toBe(0);
    expect(state.updates).toHaveLength(0);
  });
  it('blocks forged proposal, won and suppressed stages from normal sales edits', async () => {
    for (const stage of ['proposal', 'won', 'suppressed'] as const) {
      await expect(updateProspectSales(prospectId, { stage }, 'adi')).rejects.toThrow();
    }
    expect(state.updates).toHaveLength(0);
  });
  it('permits the founder to link a real quoted request, without claiming a payment', async () => {
    state.role = 'owner';
    const result = await linkProspectProposal(prospectId, orgId, quoteId,
      'Matching official storefront, reviewed technical scope.', 'owner');
    expect(result).toMatchObject({
      sales_stage: 'proposal', proposal_status: 'QUOTED', cash_collected_confirmed: false,
    });
    expect(data.get(storePath)?.linkedRequestId).toBe(quoteId);
    expect(data.get(storePath)?.stage).toBe('proposal');
  });
  it('permits non-commercial sales updates on a linked quote without changing its stage', async () => {
    state.role = 'owner';
    await linkProspectProposal(prospectId, orgId, quoteId,
      'Matching official storefront, reviewed technical scope.', 'owner');
    await updateProspectSales(prospectId, {
      next_action: 'Confirm receipt of proposal', due_date: '2026-10-19', priority: 'high',
    }, 'adi');
    expect(data.get(storePath)?.stage).toBe('proposal');
    expect(data.get(storePath)?.priority).toBe('high');
  });
});
