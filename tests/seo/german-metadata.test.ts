import { afterEach, describe, expect, it } from 'vitest';
import { generateMetadata } from '@/lib/seo';

const previousFlag = process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
const previousReadiness = process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
afterEach(() => {
  if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
  else process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = previousFlag;
  if (previousReadiness === undefined) delete process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
  else process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = previousReadiness;
});

describe('German SEO metadata', () => {
  it('uses German canonical URLs, OG language and hreflang for approved pages', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
    const data = generateMetadata({
      title: 'Shopify Agentur | CartShift Studio',
      description: 'Shopify Shops und individuelle Entwicklung.',
      url: '/solutions/shopify',
    }, 'de');

    expect(data.alternates?.canonical).toBe(`${configuredSiteUrl}/de/solutions/shopify`);
    expect(data.alternates?.languages).toMatchObject({
      de: `${configuredSiteUrl}/de/solutions/shopify`,
      en: `${configuredSiteUrl}/en/solutions/shopify`,
      he: `${configuredSiteUrl}/he/solutions/shopify`,
    });
    expect(data.openGraph).toMatchObject({ locale: 'de_DE' });
  });

  it('never advertises untranslated German articles, even with the launch enabled', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
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
