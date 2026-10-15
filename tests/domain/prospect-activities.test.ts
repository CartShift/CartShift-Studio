import { describe, expect, it } from 'vitest';
import { inferProspectSegment, isContactAllowed, prospectActivitySchema } from '@/lib/domain/prospect-activities';

describe('prospect activity and outbound compliance', () => {
  const note = { kind: 'note', note: 'Reviewed the official storefront details' };
  it('accepts a concise private research note without implying contact', () => {
    const parsed = prospectActivitySchema.parse(note);
    expect(parsed.direction).toBe('internal');
    expect(parsed.outcome).toBe('none');
  });
  it('does not disguise outbound contact as an internal review request', () => {
    expect(prospectActivitySchema.safeParse({ ...note, kind: 'review_request', direction: 'outbound' }).success).toBe(false);
    expect(prospectActivitySchema.safeParse({ ...note, kind: 'follow_up', direction: 'outbound' }).success).toBe(false);
  });
  it('requires explicit eligibility, not merely a public contact email', () => {
    expect(isContactAllowed('review_required')).toBe(false);
    expect(isContactAllowed('blocked')).toBe(false);
    expect(isContactAllowed('consent_recorded')).toBe(true);
    expect(isContactAllowed('existing_relationship')).toBe(true);
    expect(isContactAllowed('approved_partner_channel')).toBe(true);
  });
  it('limits allowed fields and cannot fabricate permission during activity logging', () => {
    expect(prospectActivitySchema.safeParse({ ...note, marketingConsent: true }).success).toBe(false);
    expect(prospectActivitySchema.safeParse({ ...note, sent: true }).success).toBe(false);
  });
  it('uses the historical note as an unverified segment hint only', () => {
    expect(inferProspectSegment('מקור: מחקר. שותף / סוכנות; שוק: גרמניה')).toBe('agency_partner');
    expect(inferProspectSegment('מקור: מחקר. בעל חנות; שוק: ישראל')).toBe('merchant');
    expect(inferProspectSegment('לא אומת')).toBe('unknown');
    expect(inferProspectSegment('בעל חנות', 'agency_partner')).toBe('agency_partner');
  });
  it('validates timestamps and note bounds', () => {
    expect(prospectActivitySchema.safeParse({ ...note, note: 'x' }).success).toBe(false);
    expect(prospectActivitySchema.safeParse({ ...note, occurred_at: 'yesterday' }).success).toBe(false);
    expect(prospectActivitySchema.safeParse({ ...note, occurred_at: '2026-10-15T14:00:00+02:00' }).success).toBe(true);
  });
});
