import { describe, expect, it } from 'vitest';
import { minimalSuppressedProspect } from '@/lib/domain/prospect-privacy';

describe('prospect data minimization', () => {
  it('retains only a non-contactable business domain, not personal details or permission', () => {
    const actual = minimalSuppressedProspect('shop.co.il');
    expect(actual).toEqual({
      canonicalDomain: 'shop.co.il',
      storeUrl: 'https://shop.co.il',
      doNotContact: true,
      stage: 'suppressed',
      outreachEligibility: 'blocked',
      redactionState: 'completed',
      verifiedIssueCount: 0,
    });
    expect(JSON.stringify(actual)).not.toContain('email');
    expect(actual).not.toHaveProperty('researchNote');
    expect(actual).not.toHaveProperty('permissionEvidenceUrl');
    expect(actual).not.toHaveProperty('sourceUrl');
  });
  it('cannot create a contactable tombstone for invalid domains', () => {
    expect(() => minimalSuppressedProspect('https://shop.co.il/@person')).toThrow();
  });
});
