import { beforeEach, describe, expect, it, vi } from 'vitest';

const records = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const ref = (path: string) => ({
  id: path.split('/').pop()!, path,
  get: async () => ({ exists: records.has(path), data: () => records.get(path) }),
});
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => new Date('2026-10-15T18:00:00Z'),
    arrayUnion: (value: string) => ({ operation: 'append', value }),
  },
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (name: string) => ({ doc: (id: string = 'audit') => ref(name + '/' + id) }),
    runTransaction: async (run: (tx: {
      get: (r: ReturnType<typeof ref>) => Promise<unknown>;
      create: (r: ReturnType<typeof ref>, value: Record<string, unknown>) => void;
      update: (r: ReturnType<typeof ref>, value: Record<string, unknown>) => void;
    }) => Promise<unknown>) => run({
      get: r => r.get(),
      create: (r, value) => { if (records.has(r.path)) throw Error('DUPLICATE'); records.set(r.path, value); },
      update: (r, value) => {
        const previous = records.get(r.path) || {};
        const linked = value.linkedMarketingLeadIds;
        records.set(r.path, { ...previous, ...value,
          ...(linked && typeof linked === 'object' && 'operation' in linked
            ? { linkedMarketingLeadIds: [...(previous.linkedMarketingLeadIds as string[] || []), (linked as { operation: string; value: string }).value] }
            : {}),
        });
      },
    }),
  },
}));
import { linkInboundLeadToProspect } from '@/lib/services/prospect-inbound-link-server';
import { prospectDocumentId } from '@/lib/domain/prospects';

const leadId = 'marketing_lead_12345';
const domain = 'shop.co.il';
const prospectKey = 'agency_prospects/' + prospectDocumentId(domain);

beforeEach(() => {
  records.clear();
  records.set('portal_users/adi', {
    accountType: 'AGENCY', agencyRole: 'business_development', status: 'active',
  });
  records.set('marketing_leads/' + leadId, {
    storeUrl: 'https://www.shop.co.il/collections/new', email: 'private@example.net',
    company: 'Example Business', marketingConsent: true,
  });
});

describe('inbound lead to prospect handoff', () => {
  it('creates one private candidate without email or implied permission', async () => {
    const result = await linkInboundLeadToProspect(leadId, 'adi');
    expect(result.created).toBe(true);
    expect(result.message_sent).toBe(false);
    expect(result.outreach_approved).toBe(false);
    expect(records.get(prospectKey)).toMatchObject({
      canonicalDomain: domain, outreachEligibility: 'review_required',
      sourceType: 'inbound_marketing', ownerUid: 'adi',
      linkedMarketingLeadIds: [leadId],
    });
    const data = JSON.stringify(records.get(prospectKey));
    expect(data).not.toContain('private@example.net');
    expect(data).not.toContain('marketingConsent');
    expect(data).not.toContain('true,"contactReady"');
  });

  it('deduplicates repeat transfers and retains existing prospect fields', async () => {
    await linkInboundLeadToProspect(leadId, 'adi');
    const second = await linkInboundLeadToProspect(leadId, 'adi');
    expect(second.created).toBe(false);
    expect(second.already_linked).toBe(true);
    expect(records.get(prospectKey)?.linkedMarketingLeadIds).toEqual([leadId]);
    expect(records.get(prospectKey)?.outreachEligibility).toBe('review_required');
  });

  it('rejects a suppressed prospect and never re-enables outreach', async () => {
    records.set(prospectKey, {
      canonicalDomain: domain, stage: 'suppressed', doNotContact: true,
      outreachEligibility: 'blocked',
    });
    await expect(linkInboundLeadToProspect(leadId, 'adi')).rejects.toThrow('PROSPECT_SUPPRESSED');
    expect(records.get(prospectKey)?.doNotContact).toBe(true);
  });

  it('refuses a missing store URL and suspended operator', async () => {
    records.get('marketing_leads/' + leadId)!.storeUrl = '';
    await expect(linkInboundLeadToProspect(leadId, 'adi')).rejects.toThrow();
    records.get('portal_users/adi')!.status = 'suspended';
    await expect(linkInboundLeadToProspect(leadId, 'adi')).rejects.toThrow('FORBIDDEN');
  });

  it('rejects unrelated or invalid marketing lead identifiers', async () => {
    await expect(linkInboundLeadToProspect('../secret', 'adi')).rejects.toThrow('INVALID_LEAD_ID');
  });
});
