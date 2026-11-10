import { afterEach, describe, expect, it } from 'vitest';
import { generateMetadata } from '@/lib/seo';

const previousFlag = process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
const previousReadiness = process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
const previousLegal = process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED;
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
afterEach(() => {
  if (previousFlag === undefined) delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
  else process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = previousFlag;
  if (previousReadiness === undefined) delete process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
  else process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = previousReadiness;
  if (previousLegal === undefined) delete process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED;
  else process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED = previousLegal;
});

describe('German SEO metadata', () => {
  it('uses German canonical URLs, OG language and hreflang for approved pages', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED = 'true';
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

  it('advertises German editorials only once the full-site launch gate is enabled', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED = 'true';
    const data = generateMetadata({
      title: 'Shopify technical audit',
      description: 'An article in English.',
      url: '/blog/shopify-technical-audit',
    }, 'en');
    expect(data.alternates?.languages).toHaveProperty('de', `${configuredSiteUrl}/de/blog/shopify-technical-audit`);
  });

  it('never advertises private analytics URLs in German', () => {
    process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
    process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED = 'true';
    const data = generateMetadata({
      title: 'Private report',
      description: 'Not public',
      url: '/tools/store-analyzer/report/private-token',
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
