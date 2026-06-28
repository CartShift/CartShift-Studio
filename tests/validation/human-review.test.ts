import { describe, expect, it } from 'vitest';
import { humanReviewRequestSchema } from '@/lib/validation';

describe('human review validation', () => {
  it('requires explicit versioned consent fields and valid analysis context', () => {
    const parsed = humanReviewRequestSchema.safeParse({
      email: 'owner@example.com',
      storeUrl: 'https://store.test',
      locale: 'en',
      primaryIssue: 'speed',
      anonymousInsightConsent: false,
      namedStoreConsent: false,
      consentVersion: '2026-06-28',
      website: '',
    });
    expect(parsed.success).toBe(true);
  });
  it('rejects honeypot submissions', () => {
    expect(
      humanReviewRequestSchema.safeParse({
        email: 'owner@example.com',
        storeUrl: 'https://store.test',
        primaryIssue: 'seo',
        consentVersion: '2026-06-28',
        website: 'spam',
      }).success
    ).toBe(false);
  });
});
