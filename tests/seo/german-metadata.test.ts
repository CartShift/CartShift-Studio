import { afterEach, describe, expect, it } from 'vitest';
import { generateMetadata } from '@/lib/seo';

const previousFlag = process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
afterEach(() => {
  if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
  else process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = previousFlag;
});

describe('German SEO metadata', () => {
  it('uses German canonical URLs, OG language and hreflang for approved pages', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    const data = generateMetadata({
      title: 'Shopify Agentur | CartShift Studio',
      description: 'Shopify Shops und individuelle Entwicklung.',
      url: '/solutions/shopify',
    }, 'de');

    expect(data.alternates?.canonical).toBe('https://cart-shift.com/de/solutions/shopify');
    expect(data.alternates?.languages).toMatchObject({
      de: 'https://cart-shift.com/de/solutions/shopify',
      en: 'https://cart-shift.com/en/solutions/shopify',
      he: 'https://cart-shift.com/he/solutions/shopify',
    });
    expect(data.openGraph).toMatchObject({ locale: 'de_DE' });
  });

  it('never advertises untranslated German articles, even with the launch enabled', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    const data = generateMetadata({
      title: 'Shopify technical audit',
      description: 'An article in English.',
      url: '/blog/shopify-technical-audit',
    }, 'en');
    expect(data.alternates?.languages).not.toHaveProperty('de');
  });

  it('omits German alternates while the launch is disabled', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'false';
    const data = generateMetadata({
      title: 'Shopify development',
      description: 'English copy.',
      url: '/solutions/shopify',
    }, 'en');
    expect(data.alternates?.languages).not.toHaveProperty('de');
  });
});
