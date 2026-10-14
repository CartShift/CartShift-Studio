import { describe, expect, it } from 'vitest';
import {
  canMoveReviewStatus, normalizeReviewStore,
  storeReviewRequestSchema, storeReviewWorkUpdateSchema,
} from '@/lib/domain/store-review';

const valid = {
  submissionId: '1f4be4c1-12cc-4ca7-8182-acdefbee1122',
  email: 'shop@brand.co.il', name: 'Store Owner',
  storeUrl: 'https://www.brand.co.il/products/test?token=secret', locale: 'he',
};

describe('expert store review validation', () => {
  it('accepts an email/store without analyzer results and keeps marketing consent opt-in', () => {
    const result = storeReviewRequestSchema.parse(valid);
    expect(result.marketingOptIn).toBe(false);
    expect(normalizeReviewStore(result.storeUrl)).toEqual({
      canonicalDomain: 'brand.co.il', storeUrl: 'https://brand.co.il',
    });
  });

  it.each([
    'http://127.0.0.1', 'http://localhost', 'https://10.0.0.1',
    'https://shop.co.il:8443', 'https://user:pass@brand.co.il',
    'https://example.local', 'ftp://brand.co.il',
  ])('rejects unsafe input domains: %s', url => {
    expect(() => normalizeReviewStore(url)).toThrow();
  });

  it('does not accept client-authored review or commercial status', () => {
    expect(storeReviewRequestSchema.safeParse({ ...valid, status: 'delivered' }).success).toBe(false);
    expect(storeReviewWorkUpdateSchema.safeParse({ status: 'won' }).success).toBe(false);
  });

  it('requires meaningful sequential review transitions', () => {
    expect(canMoveReviewStatus('requested','accepted')).toBe(true);
    expect(canMoveReviewStatus('requested','delivered')).toBe(false);
    expect(canMoveReviewStatus('in_review','delivered')).toBe(true);
    expect(canMoveReviewStatus('delivered','requested')).toBe(false);
  });
});
