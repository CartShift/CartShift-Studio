import { describe, expect, it } from 'vitest';
import { buildProspectReviewBrief } from '@/lib/domain/prospect-review-brief';

describe('manual prospect review handoff', () => {
  it('preserves source provenance and unverified status without contact PII', () => {
    const result = buildProspectReviewBrief({
      brandName: 'Sample store', canonicalDomain: 'shop.example',
      storeUrl: 'https://shop.example', platform: 'unknown',
      sourceUrl: 'https://shop.example/about',
      findings: [{
        title: 'Missing page description', category: 'seo',
        observedUrl: 'https://shop.example/', evidenceExcerpt: 'Meta description absent',
        verificationStatus: 'unverified',
      }],
    }, 'en');
    expect(result).toContain('https://shop.example/');
    expect(result).toContain('unverified');
    expect(result).toContain('Do not contact the store');
    expect(result).not.toContain('marketingConsent');
  });
  it('gives useful guidance for an empty unscanned prospect', () => {
    const result = buildProspectReviewBrief({
      brandName: 'חנות', canonicalDomain: 'shop.co.il',
      storeUrl: 'https://shop.co.il', platform: 'unknown',
      sourceUrl: 'https://shop.co.il', findings: [],
    }, 'he');
    expect(result).toContain('אין עדיין ממצאים');
    expect(result).toContain('אל תפנה לחנות');
  });
});
