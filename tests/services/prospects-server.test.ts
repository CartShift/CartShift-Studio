import { beforeEach, describe, expect, it, vi } from 'vitest';

const records = vi.hoisted(() => new Map<string, Record<string, unknown>>());

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => new Date('2026-10-14T10:00:00Z') },
}));

vi.mock('@/lib/firebase-admin', () => {
  const doc = (path: string) => ({
    id: path.split('/').pop()!,
    path,
    get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
    collection: (part: string) => collection(path + '/' + part),
  });
  const collection = (path: string) => ({
    doc: (id = 'auto-' + Math.random().toString(36).slice(2)) => doc(path + '/' + id),
    orderBy: () => ({ limit: (count: number) => ({
      get: async () => {
        const docs = [...records.entries()]
          .filter(([key]) => key.startsWith(path + '/') &&
            key.slice(path.length + 1).indexOf('/') < 0)
          .slice(0, count).map(([key, data]) => ({
            id: key.split('/').pop()!, data: () => data,
          }));
        return { docs, size: docs.length };
      },
    }) }),
  });
  return { adminDb: {
    collection,
    runTransaction: async (fn: (tx: {
      get: (ref: ReturnType<typeof doc>) => Promise<unknown>;
      create: (ref: ReturnType<typeof doc>, value: Record<string, unknown>) => void;
    }) => Promise<unknown>) => fn({
      get: ref => ref.get(),
      create: (ref, value) => {
        if (records.has(ref.path)) throw new Error('already exists');
        records.set(ref.path, value);
      },
    }),
  } };
});

import {
  upsertProspect, addProspectFinding, listProspects, getProspect,
} from '@/lib/services/prospects-server';

beforeEach(() => {
  records.clear();
  records.set('portal_users/staff', {
    accountType: 'AGENCY', agencyRole: 'sales_manager', status: 'active',
  });
  records.set('portal_users/client', { accountType: 'CLIENT', status: 'active' });
});

describe('agency prospect persistence and access', () => {
  it('upserts idempotently and preserves suppression on duplicates', async () => {
    const raw = {
      store_url: 'https://www.shop.co.il/products/first',
      source_url: 'https://www.shop.co.il/about',
    };
    const first = await upsertProspect(raw, 'staff');
    expect(first.created).toBe(true);
    const record = records.get('agency_prospects/' + first.prospect_id)!;
    expect(record.outreachEligibility).toBe('review_required');
    record.doNotContact = true;
    record.stage = 'suppressed';
    const repeat = await upsertProspect({ ...raw, store_url: 'shop.co.il' }, 'staff');
    expect(repeat.duplicate).toBe(true);
    expect(record.doNotContact).toBe(true);
    expect(record.stage).toBe('suppressed');
    expect(records.size).toBe(4); // 2 users, 1 prospect, 1 audit
  });

  it('denies clients and revoked or unauthorized agency roles', async () => {
    const data = { store_url: 'https://shop.co.il', source_url: 'https://shop.co.il' };
    await expect(upsertProspect(data, 'client')).rejects.toThrow('FORBIDDEN');
    records.set('portal_users/staff', {
      accountType: 'AGENCY', agencyRole: 'developer', status: 'active',
    });
    await expect(listProspects({}, 'staff')).rejects.toThrow('FORBIDDEN');
    records.set('portal_users/staff', {
      accountType: 'AGENCY', agencyRole: 'owner', status: 'suspended',
    });
    await expect(upsertProspect(data, 'staff')).rejects.toThrow('FORBIDDEN');
  });

  it('prevents callers from injecting marketing consent or approved findings', async () => {
    await expect(upsertProspect({
      store_url: 'https://shop.co.il', source_url: 'https://shop.co.il',
      outreachEligibility: 'consent_recorded',
    }, 'staff')).rejects.toThrow();
    const first = await upsertProspect({
      store_url: 'https://shop.co.il', source_url: 'https://shop.co.il',
    }, 'staff');
    const issue = {
      prospect_id: first.prospect_id, category: 'content',
      title: 'Shipping policy mismatch',
      observed_url: 'https://shop.co.il/pages/shipping',
      evidence_excerpt: 'One shipping policy lists 200 ILS and the footer says 300 ILS.',
    };
    const finding = await addProspectFinding(issue, 'staff');
    expect(finding.verification_status).toBe('unverified');
    expect((await addProspectFinding(issue, 'staff')).duplicate).toBe(true);
    await expect(addProspectFinding({
      ...issue, observed_url: 'https://other-shop.co.il/',
    }, 'staff')).rejects.toThrow('Finding evidence');
    await expect(addProspectFinding({
      ...issue, verificationStatus: 'verified',
    }, 'staff')).rejects.toThrow();
    const result = await getProspect(first.prospect_id, 'staff');
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].verificationStatus).toBe('unverified');
    expect([...records.keys()].some(k => k.startsWith('marketing_'))).toBe(false);
  });
});