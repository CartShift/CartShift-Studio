import { describe, expect, it, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||= 'test-api-key';
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||= 'test.firebaseapp.com';
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||= 'test-project';
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||= 'test-app-id';
  process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL ||=
    'https://us-central1-cartshiftstudio.cloudfunctions.net/contactForm';
});

describe('marketing funnel rules', () => {
  it('normalizes emails before using them as lead identity', async () => {
    const { normalizeMarketingEmail } = await import('@/lib/services/marketing');

    expect(normalizeMarketingEmail('  Owner@Example.COM ')).toBe('owner@example.com');
  });

  it('segments analyzer scores into conversion-friendly bands', async () => {
    const { getMarketingScoreBand } = await import('@/lib/services/marketing');

    expect(getMarketingScoreBand(20)).toBe('critical');
    expect(getMarketingScoreBand(55)).toBe('warning');
    expect(getMarketingScoreBand(78)).toBe('good');
    expect(getMarketingScoreBand(92)).toBe('excellent');
    expect(getMarketingScoreBand()).toBe('unknown');
  });

  it('scores high-intent contact leads above newsletter and analyzer leads', async () => {
    const { getMarketingLeadScoreDelta } = await import('@/lib/services/marketing');

    expect(getMarketingLeadScoreDelta({ source: 'contact_form' })).toBeGreaterThan(
      getMarketingLeadScoreDelta({ source: 'store_analyzer', overallScore: 84 })
    );
    expect(getMarketingLeadScoreDelta({ source: 'store_analyzer', overallScore: 42 })).toBe(35);
    expect(getMarketingLeadScoreDelta({ source: 'newsletter_footer' })).toBe(5);
  });
});
