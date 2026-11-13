import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const languages = ['en', 'he', 'de'] as const;

describe('CartShift public marketing claims and expert review flow', () => {
  it('does not describe the Honeypot quiz as launched during client review', () => {
    const { data } = matter(read('content/case-studies/i-love-my-honeypot-eco-ecommerce.md'));
    expect(data.projectStage).toContain('not yet launched');
    expect(data.he.projectStage).toContain('טרם הושקו');
    expect(data.de.projectStage).toContain('noch nicht veröffentlicht');
    expect(data.evidence[0].after).toContain('client review');
    expect(data.he.evidence[0].after).toContain('Preview');
    expect(data.de.evidence[0].after).toContain('Kundenprüfung');
  });

  it.each(languages)('labels review samples as illustrative in %s', locale => {
    const translations = JSON.parse(read(`messages/src/${locale}/store-review.json`));
    const sample = translations.storeReview.sample;
    expect(sample.disclaimer.length).toBeGreaterThan(45);
    expect(Object.keys(sample.findings).sort()).toEqual(['mobile','product','seo']);
    for (const finding of Object.values(sample.findings) as Array<{ area: string; title: string; observation: string; action: string }>) {
      expect(finding.observation).toBeTruthy();
      expect(finding.action).toBeTruthy();
    }
  });

  it.each(languages)('does not advertise unapproved prices or hard-coded delivery promises in %s', locale => {
    const content = JSON.parse(read(`messages/src/${locale}/website.json`));
    for (const item of Object.values(content.pricing.packages) as Array<{price: string; timeline: string}>) {
      expect(item.price).not.toMatch(/[€$₪]|\\d{3,}/);
      expect(item.timeline).not.toMatch(/\\d+\\s*[-–]\\s*\\d+/);
    }
    for (const item of content.seo.pricing.packages as Array<{price: string}>) {
      expect(item.price).not.toMatch(/[€$₪]|\\d{3,}/);
    }
    const paymentAnswer: string = content.pricing.faq.items[0].answer;
    expect(paymentAnswer).not.toContain('40%');
    expect(paymentAnswer).not.toContain('30%');
  });

  it('keeps review CTA and documented case studies high in the homepage journey', () => {
    const home = read('app/[locale]/(website)/page.tsx');
    expect(home.indexOf('<Hero')).toBeLessThan(home.indexOf('<ServicesOverview'));
    expect(home.indexOf('<CaseStudiesTeaser')).toBeLessThan(home.indexOf('<Testimonials'));
    expect(home).not.toContain('<PortalTeaser');
    expect(home).not.toContain('<StoreAnalyzerTeaser');
    expect(home).toContain('map(toBlogPostSummary)');
  });

  it('retains original client quotes in sources while they await publication review', () => {
    const he = JSON.parse(read('messages/src/he/website.json'));
    expect(he.testimonials.items.some((item: {company: string}) => item.company === 'Stiletto Piercing')).toBe(true);
    expect(he.testimonials.items.some((item: {company: string}) => item.company === 'I Love My Honeypot')).toBe(true);
    const component = read('components/sections/Testimonials.tsx');
    expect(component).toContain('awaitingPublicationEvidence');
  });
});
