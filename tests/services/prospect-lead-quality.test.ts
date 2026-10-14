import { describe, expect, it } from 'vitest';
import { extractProspectPageEvidence, extractFreeShippingThresholds } from '@/lib/services/prospect-scan-engine';

describe('lead-quality evidence without invented customer impact', () => {
  it('identifies contradictory published free-shipping thresholds from public copy', () => {
    const home = extractFreeShippingThresholds('https://shop.co.il/',
      '<p>משלוח חינם בקנייה מעל ₪399</p>');
    const policy = extractFreeShippingThresholds('https://shop.co.il/policies/shipping-policy',
      '<p>משלוח חינם מעל 449 ש"ח</p>');
    expect(home[0].amount).toBe(399);
    expect(policy[0].amount).toBe(449);
    expect(home[0].sourceUrl).toBe('https://shop.co.il/');
  });

  it('accepts named company decision makers only with official-site structured evidence', () => {
    const html = '<script type="application/ld+json">' +
      JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person',
        name: 'Dana Cohen', jobTitle: 'Founder', worksFor: { name: 'Test Brand' } }) +
      '</script>';
    const result = extractProspectPageEvidence('https://shop.co.il/pages/about', html, false);
    expect(result.contacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Dana Cohen', role: 'Founder',
        source_url: 'https://shop.co.il/pages/about' }),
    ]));
    expect(result.contacts[0]).not.toHaveProperty('marketingConsent');
  });

  it('ignores non-decision maker testimonials and raw guessed email', () => {
    const html = '<script type="application/ld+json">' +
      JSON.stringify({ '@type': 'Person', name: 'Happy Customer', jobTitle: 'Customer' }) +
      '</script><p>support@shop.co.il</p>';
    const result = extractProspectPageEvidence('https://shop.co.il/pages/about', html, false);
    expect(result.contacts).toEqual([]);
  });
});