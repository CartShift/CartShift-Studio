import { describe, expect, it } from 'vitest';
import { newsletterSubscriptionSchema, contactFormSchema } from '@/lib/validation';
import { storeReviewRequestSchema } from '@/lib/domain/store-review';

describe('German public marketing forms', () => {
  it('accepts German newsletter subscriptions without silently replacing locale', () => {
    const result = newsletterSubscriptionSchema.safeParse({
      email: 'shop@beispiel.de',
      locale: 'de',
      source: 'newsletter_footer',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.locale).toBe('de');
  });

  it('accepts German expert store review leads with their original locale', () => {
    const result = storeReviewRequestSchema.safeParse({
      name: 'Beispiel Shop',
      email: 'shop@beispiel.de',
      storeUrl: 'https://beispiel.de',
      locale: 'de',
      submissionId: 'ad20c60c-35e7-452c-a866-4eb9cde8a716',
      marketingOptIn: false,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.locale).toBe('de');
  });

  it('accepts German contact inquiries with partner attribution', () => {
    const result = contactFormSchema.safeParse({
      name: 'Beispiel Shop',
      email: 'shop@beispiel.de',
      locale: 'de',
      message: 'Shopify-Shop optimieren',
      attribution: { utmSource: 'partner', partnerCode: 'DE-BERLIN' },
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.locale).toBe('de');
  });
});
