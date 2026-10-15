import { beforeEach, describe, expect, it, vi } from 'vitest';

const data = vi.hoisted(() => new Map<string, Record<string, unknown>>());
const ref = (path: string) => ({
  id: path.split('/').pop()!,
  path,
  get: async () => ({ exists: data.has(path), data: () => data.get(path) }),
  collection: (part: string) => ({ doc: (id: string = 'activity-1') => ref(path + '/' + part + '/' + id) }),
});
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => new Date('2026-10-15T12:00:00Z'),
    increment: (n: number) => n,
  },
}));
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: (path: string) => ({
      doc: (id: string = 'audit-1') => ref(path + '/' + id),
    }),
    runTransaction: async (operation: (tx: {
      get: (r: ReturnType<typeof ref>) => Promise<unknown>;
      create: (r: ReturnType<typeof ref>, value: Record<string, unknown>) => void;
      update: (r: ReturnType<typeof ref>, value: Record<string, unknown>) => void;
    }) => Promise<unknown>) => operation({
      get: r => r.get(),
      create: (r, value) => {
        if (data.has(r.path)) throw new Error('already exists');
        data.set(r.path, value);
      },
      update: (r, value) => data.set(r.path, { ...data.get(r.path), ...value }),
    }),
  },
}));
import { addProspectActivity } from '@/lib/services/prospect-activities-server';

const id = 'prospect_' + 'a'.repeat(32);
const path = 'agency_prospects/' + id;

beforeEach(() => {
  data.clear();
  data.set('portal_users/adi', {
    accountType: 'AGENCY', agencyRole: 'business_development', status: 'active',
  });
  data.set('portal_users/founder', {
    accountType: 'AGENCY', agencyRole: 'owner', status: 'active',
  });
  data.set(path, {
    canonicalDomain: 'test-shop.co.il', stage: 'qualified',
    outreachEligibility: 'review_required', doNotContact: false,
  });
});

describe('human-recorded prospect activity', () => {
  it('allows business development to log internal research without sending outreach', async () => {
    const result = await addProspectActivity(id, {
      kind: 'note', note: 'Store reviewed; Shopify platform still needs verification',
    }, 'adi');
    expect(result.recorded).toBe(true);
    expect(result.message_sent).toBe(false);
    expect(data.get(path + '/activities/activity-1')?.direction).toBe('internal');
    expect(data.get('agency_prospect_audit/audit-1')?.action).toBe('prospect.activity_added');
    expect([...data.keys()].filter(key => key.includes('marketing_email_jobs'))).toHaveLength(0);
  });

  it('prevents unreviewed cold outreach even when the salesperson tries to log it', async () => {
    await expect(addProspectActivity(id, {
      kind: 'email', direction: 'outbound', note: 'I sent the store owner an email',
    }, 'adi')).rejects.toThrow('OUTREACH_REVIEW_REQUIRED');
    expect(data.has(path + '/activities/activity-1')).toBe(false);
  });

  it('allows logging outbound activity only after founder eligibility review', async () => {
    data.get(path)!.outreachEligibility = 'consent_recorded';
    const result = await addProspectActivity(id, {
      kind: 'email', direction: 'outbound', outcome: 'responded',
      note: 'Responded to an existing opt-in email conversation',
    }, 'adi');
    expect(result.recorded).toBe(true);
    expect(data.get(path)?.lastContactedAt).toBeInstanceOf(Date);
  });

  it('requires founder review for completed technical assessments', async () => {
    await expect(addProspectActivity(id, {
      kind: 'review_completed', note: 'Technical report finished with source-backed findings',
    }, 'adi')).rejects.toThrow('FOUNDER_REVIEW_REQUIRED');
    await addProspectActivity(id, {
      kind: 'review_completed', note: 'Technical report finished with source-backed findings',
    }, 'founder');
    expect(data.get(path)?.deepReviewStatus).toBe('completed');
  });

  it('denies revoked roles and suppressed businesses', async () => {
    data.get('portal_users/adi')!.status = 'suspended';
    await expect(addProspectActivity(id, { kind: 'note', note: 'Suspended user' }, 'adi'))
      .rejects.toThrow('FORBIDDEN');
    data.get('portal_users/adi')!.status = 'active';
    data.get(path)!.doNotContact = true;
    await expect(addProspectActivity(id, { kind: 'note', note: 'Suppressed store' }, 'adi'))
      .rejects.toThrow('PROSPECT_SUPPRESSED');
  });
});
