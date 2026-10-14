import { describe, expect, it } from 'vitest';
import { buildProspectCrawlPlan, robotsAllowsPath, extractProspectPageEvidence, publicIpv4Only } from '@/lib/services/prospect-scan-engine';

describe('bounded prospect scanning', () => {
  it('selects only same-domain public pages, deduplicates and caps targets', () => {
    const html = [
      '<a href="/collections/bags">Bags</a><a href="/products/bag">Bag</a>',
      '<a href="/pages/about-us">About</a><a href="/pages/contact">Contact</a>',
      '<a href="/policies/shipping-policy">Shipping</a><a href="/products/bag">duplicate</a>',
      '<a href="https://outside.example.com/pages/contact">Outside</a>',
      '<a href="/cart">Cart</a><a href="/account/login">Account</a>',
    ].join('');
    const pages = buildProspectCrawlPlan('https://www.store.co.il', html);
    expect(pages.length).toBeLessThanOrEqual(6);
    expect(pages).toContain('https://www.store.co.il/pages/about-us');
    expect(pages).toContain('https://www.store.co.il/pages/contact');
    expect(pages).not.toContain('https://www.store.co.il/cart');
    expect(pages.every(url => new URL(url).hostname === 'www.store.co.il')).toBe(true);
  });

  it('respects robots disallow, allows most specific rule and fails closed for no valid rules', () => {
    const rules = ['User-agent: *', 'Disallow: /products/', 'Allow: /products/public/', 'Disallow: /admin'].join('\n');
    expect(robotsAllowsPath(rules, '/products/secret')).toBe(false);
    expect(robotsAllowsPath(rules, '/products/public/item')).toBe(true);
    expect(robotsAllowsPath(rules, '/pages/about')).toBe(true);
    expect(robotsAllowsPath('User-agent: CartShift-AuditBot\nDisallow: /', '/')).toBe(false);
  });

  it('records only candidates with explicit observed source and no consent claim', () => {
    const html = '<html><head><title>Bag shop</title></head><body><h1>Bags</h1>' +
      '<a href="mailto:hello@store.co.il">Contact our team</a></body></html>';
    const value = extractProspectPageEvidence('https://store.co.il', html, true);
    expect(value.findings.some(f => f.title.includes('description'))).toBe(true);
    expect(value.contacts.some(c => c.business_email === 'hello@store.co.il')).toBe(true);
    expect(value.contacts[0].role).toBe('Business contact');
    expect(value.contacts[0]).not.toHaveProperty('marketingConsent');
  });

  it('refuses private and documentation IP addresses before any socket is opened', () => {
    expect(publicIpv4Only('93.184.216.34')).toBe(true);
    for (const addr of ['10.0.0.1', '127.0.0.1', '169.254.169.254',
      '192.168.1.2', '198.18.0.1', '198.51.100.2', '203.0.113.4',
      '192.0.2.1', '224.0.0.1', '::ffff:127.0.0.1']) {
      expect(publicIpv4Only(addr)).toBe(false);
    }
  });
});