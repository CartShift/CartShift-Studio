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
