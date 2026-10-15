import { describe, expect, it } from 'vitest';
import { prospectReviewSchema, prospectSalesUpdateSchema, canLinkProspectToOrganization } from '@/lib/domain/prospect-sales';

describe('prospect commercial and compliance guards', () => {
  it('requires evidence when claiming prior consent or lawful business relationship', () => {
    expect(prospectReviewSchema.safeParse({
      outreach_eligibility: 'consent_recorded',
      note: 'Explicit permission was documented by the owner.',
    }).success).toBe(false);
    expect(prospectReviewSchema.safeParse({
      outreach_eligibility: 'consent_recorded',
      evidence_url: 'https://store.co.il/pages/partner-consent',
      note: 'Explicit permission was documented by the owner.',
    }).success).toBe(true);
  });

  it('allows suppressing an unwilling business without needing a source URL', () => {
    expect(prospectReviewSchema.safeParse({
      outreach_eligibility: 'blocked', note: 'Do not contact: business opted out in a prior interaction.',
    }).success).toBe(true);
  });

  it('does not accept fake billing, permission or technical approval fields in sales updates', () => {
    expect(prospectSalesUpdateSchema.safeParse({
      stage: 'qualified', marketingConsent: true,
    }).success).toBe(false);
    expect(prospectSalesUpdateSchema.safeParse({
      stage: 'proposal', paidAt: '2026-10-14T10:00:00Z',
    }).success).toBe(false);
    expect(prospectSalesUpdateSchema.safeParse({
      priority: 'high', segment: 'merchant', archived: false, due_date: '', owner_uid: '',
    }).success).toBe(true);
    expect(prospectSalesUpdateSchema.safeParse({
      stage: 'qualified', next_action: 'Schedule an approved business discovery call',
      due_date: '2026-10-20',
    }).success).toBe(true);
  });
});
describe('commercial account identity binding', () => {
  it('matches only the same website domain before linking an existing paid proposal', () => {
    expect(canLinkProspectToOrganization('shop.co.il', 'https://www.shop.co.il/pages/about', 'sales_manager')).toBe(true);
    expect(canLinkProspectToOrganization('shop.co.il', 'https://another-shop.co.il', 'owner')).toBe(false);
    expect(canLinkProspectToOrganization('shop.co.il', 'https://shop.co.il.evil.com', 'owner')).toBe(false);
  });

  it('requires a founder when the existing client has no verified business website', () => {
    expect(canLinkProspectToOrganization('shop.co.il', undefined, 'sales_manager')).toBe(false);
    expect(canLinkProspectToOrganization('shop.co.il', '', 'owner')).toBe(true);
  });
});
