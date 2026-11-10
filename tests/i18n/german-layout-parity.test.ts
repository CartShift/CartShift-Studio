import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
const sharedPages = [
  'app/[locale]/(website)/page.tsx',
  'app/[locale]/(website)/about/page.tsx',
  'app/[locale]/(website)/contact/page.tsx',
  'app/[locale]/(website)/work/page.tsx',
  'app/[locale]/(website)/solutions/shopify/page.tsx',
  'app/[locale]/(website)/solutions/wordpress/page.tsx',
  'app/[locale]/(website)/solutions/seo/page.tsx',
];

describe('German website is a translation of the existing site, not a second website', () => {
  it.each(sharedPages)('%s keeps the original shared page implementation', file => {
    const source = read(file);
    expect(source).not.toMatch(/German(MarketingPage|ContactPage|AboutPage|WorkPage|Chrome)/);
    expect(source).not.toMatch(/if\s*\(\s*locale\s*===\s*['"]de['"]\s*\)\s*return\s*</);
  });

  it('retains the full homepage section order', () => {
    const source = read(sharedPages[0]);
    const sections = [
      '<Hero', '<HomepageIntro', '<ServicesOverview', '<Process', '<WhyChoose',
      '<CaseStudiesTeaser', '<Testimonials', '<StoreAnalyzerTeaser', '<PortalTeaser',
      '<BlogTeaser', '<CTABanner',
    ];
    let index = 0;
    for (const section of sections) {
      const found = source.indexOf(section, index);
      expect(found, `Missing or re-ordered homepage section: ${section}`).toBeGreaterThan(-1);
      index = found + section.length;
    }
  });

  it('uses the same header, footer, overlays and cookie consent for each locale', () => {
    const shell = read('components/layout/MainLayout.tsx');
    for (const name of ['<Header', '<Footer', '<FloatingActions', '<ExitIntentModal', '<CookieConsent']) {
      expect(shell).toContain(name);
    }
    expect(shell).not.toContain('GermanChrome');
    const layout = read('app/[locale]/(website)/layout.tsx');
    expect(layout).toContain('<MainLayout>{children}</MainLayout>');
  });

  it('keeps incomplete German content behind an explicit approval gate', () => {
    const flags = read('lib/i18n/german-routes.ts');
    expect(flags).toContain('NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED');
    expect(flags).toContain('NEXT_PUBLIC_GERMAN_MARKETING_ENABLED');
    expect(flags).toContain('NEXT_PUBLIC_GERMAN_LEGAL_APPROVED');
    expect(flags).not.toContain("NEXT_PUBLIC_CARTSHIFT_DE_PREVIEW");
  });
});
