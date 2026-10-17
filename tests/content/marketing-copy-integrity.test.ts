import { describe, expect, it } from 'vitest';
import en from '../../messages/src/en/website.json';
import he from '../../messages/src/he/website.json';
import enReview from '../../messages/src/en/store-review.json';
import heReview from '../../messages/src/he/store-review.json';

const locales = [
  { name: 'English', site: en, review: enReview.storeReview },
  { name: 'Hebrew', site: he, review: heReview.storeReview },
] as const;

describe('public website content integrity', () => {
  for (const { name, site, review } of locales) {
    describe(name, () => {
      it('offers one clear expert-led review rather than promising an instant automated result', () => {
        expect(review.finePrint.length).toBeGreaterThan(50);
        expect(site.hero.description.length).toBeGreaterThan(75);
        expect(site.blogPost.storeAnalyzerCta.description).toMatch(
          /(?:אינה בדיקה אוטומטית מיידית|not an instant automated report)/i
        );
        expect(site.blogPost.storeAnalyzerCta.stats.analyzed).toBe('3–5');
      });

      it('does not promise a universal 24-hour contact response', () => {
        const contact = [
          site.contact.hero.description,
          site.contact.quickResponseText,
          site.contact.form.successText,
        ].join(' ');
        expect(contact).not.toMatch(/(?:24 hours|24 שעות)/i);
        expect(site.heroForm.subtitle + ' ' + site.heroForm.successText).not.toMatch(/(?:24 hours|24 שעות|תוך 24)/i);
      });

      it('explains that WooCommerce may fit without contradicting Shopify specialization', () => {
        const commerceFaq = site.wordpress.faq.items[1];
        expect(commerceFaq.question).toMatch(/(?:WordPress|וורדפרס)/i);
        expect(commerceFaq.answer).toMatch(/WooCommerce/);
        expect(commerceFaq.answer).toMatch(/Shopify|שופיפיי/);
        expect(commerceFaq.answer).not.toMatch(/^(?:No,|לא,)/);
      });

      it('provides topic-specific review CTAs without claiming an instant two-minute audit', () => {
        const entries = Object.entries(site.blogPost.contextualAnalyzer);
        expect(entries.map(([key]) => key)).toEqual(
          expect.arrayContaining(['speed', 'seo', 'conversion', 'trust', 'checkout'])
        );
        for (const [, item] of entries) {
          expect(item.description.length).toBeGreaterThan(50);
          expect(item.description).not.toMatch(/(?:under two minutes|פחות משתי דקות)/i);
        }
      });
    });
  }
});

describe('industry proof and commercial offer boundaries', () => {
  for (const { name, site, review } of locales) {
    it(`${name}: industry proof describes process rather than fabricated metrics`, () => {
      expect(site.industries.proof.steps).toHaveLength(3);
      expect(JSON.stringify(site.industries.proof)).not.toMatch(/(?:150\+|98%|2\.5x|24\/7)/);
    });

    it(`${name}: free and paid reviews have distinct promises`, () => {
      expect(review.scopeComparison.free.description.length).toBeGreaterThan(55);
      expect(review.scopeComparison.storeAudit.description.length).toBeGreaterThan(55);
      expect(review.scopeComparison.seoAudit.description.length).toBeGreaterThan(55);
      expect(site.pricing.faq.items.some(item =>
        /(?:free|בחינם)/i.test(item.question) && /(?:audit|אודיט)/i.test(item.question)
      )).toBe(true);
    });

    it(`${name}: customer quotes stay available as provided`, () => {
      expect(site.testimonials.items.length).toBeGreaterThanOrEqual(3);
      expect(site.testimonials.items.every(item =>
        item.quote.length > 50 && item.author && item.company
      )).toBe(true);
    });
  }
});
