import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown>>(),
  sequence: 0,
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => new Date('2026-10-14T03:00:00Z') },
}));
vi.mock('@/lib/services/prospects-server', () => ({
  requireProspectActor: async (uid: string) => ({
    uid, role: uid === 'sales' ? 'sales_manager' : 'owner',
  }),
}));

vi.mock('@/lib/firebase-admin', () => {
  const ref = (path: string) => ({
    path,
    get: async () => ({ exists: state.docs.has(path), data: () => state.docs.get(path) }),
    collection: (child: string) => collection(path + '/' + child),
    set: async (data: Record<string, unknown>) => { state.docs.set(path, data); },
  });
  const collection = (path: string) => {
    const query = (condition?: { field: string; value: string }, max = Infinity) => ({
      limit: (n: number) => query(condition, n),
      get: async () => {
        const docs = [...state.docs.entries()].filter(([key, value]) => {
          return key.startsWith(path + '/') &&
            key.slice(path.length + 1).indexOf('/') === -1 &&
            (!condition || value[condition.field] === condition.value);
        }).slice(0, max).map(([key, value]) => ({
          id: key.split('/').pop()!, ref: ref(key), data: () => value,
        }));
        return { docs, empty: docs.length === 0 };
      },
    });
    return {
      ...query(),
      where: (field: string, _operator: string, value: string) =>
        query({ field, value }),
      doc: (id = 'generated_' + ++state.sequence) => ref(path + '/' + id),
      add: async (value: Record<string, unknown>) => {
        state.docs.set(path + '/generated_' + ++state.sequence, value);
      },
    };
  };
  return { adminDb: {
    collection,
    runTransaction: async (fn: (tx: {
      get: (reference: ReturnType<typeof ref>) => Promise<unknown>;
      update: (reference: ReturnType<typeof ref>, value: Record<string, unknown>) => void;
    }) => Promise<unknown>) => fn({
      get: reference => reference.get(),
      update: (reference, value) => state.docs.set(reference.path, {
        ...state.docs.get(reference.path), ...value,
      }),
    }),
    batch: () => {
      const deletions: string[] = [];
      return {
        delete: (reference: ReturnType<typeof ref>) => { deletions.push(reference.path); },
        commit: async () => { deletions.forEach(key => state.docs.delete(key)); },
      };
    },
  } };
});

import { redactProspect } from '@/lib/services/prospect-privacy-server';

const id = 'prospect_' + 'a'.repeat(32);
const base = 'agency_prospects/' + id;

beforeEach(() => {
  state.docs.clear();
  state.sequence = 0;
  state.docs.set(base, {
    canonicalDomain: 'shop.co.il',
    storeUrl: 'https://shop.co.il', doNotContact: false,
    brandName: 'Customer', researchNote: 'Contact Dana on private mobile',
    sourceUrl: 'https://shop.co.il/contact',
    linkedRequestId: 'request_private', ownerUid: 'sales',
  });
  state.docs.set(base + '/findings/finding_private', { title: 'Something private' });
  state.docs.set(base + '/contacts/contact_private', { businessEmail: 'dana@shop.co.il' });
  state.docs.set(base + '/activities/activity_private', { kind: 'email', note: 'Private discussion with Dana' });
  state.docs.set('agency_prospect_audit/old_audit', {
    targetId: id, evidenceUrl: 'https://shop.co.il/person/dana',
  });
  state.docs.set('agency_prospect_audit/old_audit_2', {
    prospectId: id, note: 'Private notes on Dana',
  });
});

describe('owner-controlled irreversible research redaction', () => {
  it('removes evidence and contacts, retains suppression, and never recreates a prospect', async () => {
    const result = await redactProspect(id, 'owner');
    expect(result.redacted).toBe(true);
    expect(state.docs.get(base)).toMatchObject({
      canonicalDomain: 'shop.co.il', doNotContact: true,
      stage: 'suppressed', outreachEligibility: 'blocked',
    });
    const serialized = JSON.stringify([...state.docs.entries()]);
    expect(serialized).not.toContain('dana@shop.co.il');
    expect(serialized).not.toContain('request_private');
    expect(serialized).not.toContain('Private notes on Dana');
    expect(serialized).not.toContain('Private discussion with Dana');
    expect([...state.docs.keys()].filter(key => key.startsWith(base + '/'))).toEqual([]);
    expect(await redactProspect(id, 'owner')).toMatchObject({ redacted: true, suppressed: true });
  });

  it('rejects a sales manager without altering or deleting anything', async () => {
    await expect(redactProspect(id, 'sales')).rejects.toThrow('FOUNDER_REVIEW_REQUIRED');
    expect(state.docs.get(base)?.doNotContact).toBe(false);
    expect(state.docs.has(base + '/contacts/contact_private')).toBe(true);
  });
});
