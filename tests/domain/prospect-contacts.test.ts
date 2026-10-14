import { describe, expect, it } from 'vitest';
import { prospectContactCandidateSchema } from '@/lib/domain/prospect-contacts';

describe('business contact research candidates', () => {
  const valid = {
    prospect_id: 'prospect_' + 'a'.repeat(32),
    role: 'Head of Ecommerce',
    source_url: 'https://shop.co.il/pages/about',
    evidence_excerpt: 'The company lists its ecommerce lead on this public page.',
  };
  it('allows role-only prospects without invented personal contact details', () => {
    expect(prospectContactCandidateSchema.safeParse(valid).success).toBe(true);
  });
  it('rejects unsourced details and forged consent', () => {
    expect(prospectContactCandidateSchema.safeParse({ ...valid, source_url: undefined }).success).toBe(false);
    expect(prospectContactCandidateSchema.safeParse({ ...valid, outreachEligibility: 'approved' }).success).toBe(false);
    expect(prospectContactCandidateSchema.safeParse({ ...valid, phone: '050-1234567' }).success).toBe(false);
  });
});