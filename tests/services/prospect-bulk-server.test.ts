import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const mock = vi.hoisted(() => ({ transactionCalls: 0 }));
const ref = (path: string) => ({ id: path.split('/').pop()!, path,
  get: async () => ({ exists: data.has(path), data: () => data.get(path) }),
});
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => new Date('2026-10-16T08:00:00Z') },
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({ doc: (id = 'audit_' + Math.random().toString(36).slice(2)) => ref(name + '/' + id) }),
    runTransaction: async (fn: (tx: {
      get: (r: ReturnType<typeof ref>) => Promise<unknown>;
      update: (r: ReturnType<typeof ref>, patch: Record<string, unknown>) => void;
      create: (r: ReturnType<typeof ref>, value: Record<string, unknown>) => void;
    }) => Promise<unknown>) => {
      mock.transactionCalls++;
      return fn({
        get: r => r.get(),
        update: (r, patch) => data.set(r.path, { ...data.get(r.path), ...patch }),
        create: (r, value) => data.set(r.path, value),
      });
    },
  },
}));
import { bulkUpdateProspectWorklist, prospectBulkSchema } from '@/lib/services/prospect-bulk-server';
const one = 'prospect_' + '1'.repeat(32), two = 'prospect_' + '2'.repeat(32);
const path = (id: string) => 'agency_prospects/' + id;
beforeEach(() => {
  data.clear(); mock.transactionCalls = 0;
  data.set('portal_users/adi', { accountType: 'AGENCY', agencyRole: 'business_development', status: 'active' });
  data.set('portal_users/owner', { accountType: 'AGENCY', agencyRole: 'owner', status: 'active' });
  data.set(path(one), { canonicalDomain: 'one.co.il', stage: 'qualified', doNotContact: false });
  data.set(path(two), { canonicalDomain: 'two.co.il', stage: 'qualified', doNotContact: false });
});
describe('bounded worklist bulk operations', () => {
  it('allows safe batching of priorities and assignments to active agency staff', async () => {
    const result = await bulkUpdateProspectWorklist({
      prospect_ids: [one, two], patch: { owner_uid: 'owner', priority: 'high' },
    }, 'adi');
    expect(result.updated).toBe(2);
    expect(result.message_sent).toBe(false);
    expect(data.get(path(one))?.ownerUid).toBe('owner');
    expect(data.get(path(two))?.priority).toBe('high');
  });
  it('rejects duplicate IDs, empty updates and unbounded batches', () => {
    expect(prospectBulkSchema.safeParse({ prospect_ids: [one, one], patch: { priority: 'high' } }).success).toBe(false);
    expect(prospectBulkSchema.safeParse({ prospect_ids: [one], patch: {} }).success).toBe(false);
    expect(prospectBulkSchema.safeParse({ prospect_ids: Array.from({ length: 21 }, (_, i) =>
      'prospect_' + i.toString(16).padStart(32, '0')), patch: { archived: true } }).success).toBe(false);
  });
  it('prevents updates to any suppressed prospect in the batch', async () => {
    data.get(path(two))!.doNotContact = true;
    await expect(bulkUpdateProspectWorklist({ prospect_ids: [one, two], patch: { archived: false } }, 'adi'))
      .rejects.toThrow('PROSPECT_SUPPRESSED');
    expect(data.get(path(one))?.archived).toBeUndefined();
  });
  it('rejects revoked owners and invalid staff assignments', async () => {
    data.get('portal_users/owner')!.status = 'suspended';
    await expect(bulkUpdateProspectWorklist({ prospect_ids: [one], patch: { owner_uid: 'owner' } }, 'adi'))
      .rejects.toThrow('INVALID_OWNER');
  });
});
