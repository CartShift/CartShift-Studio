import { describe, expect, it } from 'vitest';
import {
  normalizeProspectStoreUrl,
  prospectDocumentId,
  upsertProspectSchema,
  prospectFindingSchema,
  verifyProspectEvidenceUrl,
} from '@/lib/domain/prospects';

describe('prospect domain validation', () => {
  it('deduplicates www and bare domains', () => {
    const first = normalizeProspectStoreUrl('https://www.example-shop.co.il/products/item');
    const second = normalizeProspectStoreUrl('example-shop.co.il');
    expect(first.canonicalDomain).toBe(second.canonicalDomain);
    expect(first.storeUrl).toBe('https://example-shop.co.il');
    expect(prospectDocumentId(first.canonicalDomain)).toBe(prospectDocumentId(second.canonicalDomain));
  });

  it.each(['http://shop.co.il', 'https://localhost', 'https://127.0.0.1',
    'https://a.local', 'https://shop.co.il:8080', 'https://user:pass@shop.co.il'])(
    'rejects unsafe or non-HTTPS business URLs: %s', input => {
      expect(() => normalizeProspectStoreUrl(input)).toThrow();
    });

  it('rejects unrelated source domains for finding evidence', () => {
    expect(() => verifyProspectEvidenceUrl('https://other.co.il/p', 'shop.co.il')).toThrow();
    expect(verifyProspectEvidenceUrl('https://www.shop.co.il/p', 'shop.co.il'))
      .toBe('https://www.shop.co.il/p');
  });

  it('does not permit user-controlled consent, verified status or contact metadata', () => {
    expect(upsertProspectSchema.safeParse({
      store_url: 'https://shop.co.il', source_url: 'https://shop.co.il/about',
      marketingConsent: true,
    }).success).toBe(false);
    expect(prospectFindingSchema.safeParse({
      prospect_id: prospectDocumentId('shop.co.il'), category: 'ux', title: 'Broken add to cart',
      observed_url: 'https://shop.co.il/products/item',
      evidence_excerpt: 'Button cannot be reached with keyboard during a manual review',
      verificationStatus: 'verified',
    }).success).toBe(false);
  });
});