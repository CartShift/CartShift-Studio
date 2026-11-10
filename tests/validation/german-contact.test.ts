import { describe, expect, it } from 'vitest';
import { validateContactForm } from '@/lib/validation';

describe('German contact lead validation', () => {
  const germanInquiry = {
    name: 'Mara Müller',
    email: 'mara@example.de',
    company: 'Musterladen',
    projectType: 'new-shop',
    message: 'Wir möchten unseren Laden mit einem Onlineshop erweitern.',
    locale: 'de' as const,
    attribution: {
      utmSource: 'michael',
      utmMedium: 'outreach',
      utmCampaign: 'berlin-retail',
      partnerCode: 'local-partner',
    },
  };

  it('accepts a German project inquiry with bounded attribution', () => {
    const result = validateContactForm(germanInquiry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe('de');
      expect(result.data.attribution).toMatchObject({
        utmSource: 'michael',
        utmMedium: 'outreach',
        utmCampaign: 'berlin-retail',
      });
    }
  });

  it('rejects excessively long marketing parameters', () => {
    const result = validateContactForm({
      ...germanInquiry,
      attribution: { ...germanInquiry.attribution, utmCampaign: 'x'.repeat(161) },
    });
    expect(result.success).toBe(false);
  });

  it('rejects locales not implemented in the lead pipeline', () => {
    expect(validateContactForm({ ...germanInquiry, locale: 'fr' }).success).toBe(false);
  });
});
