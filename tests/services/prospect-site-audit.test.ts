import { describe, expect, it, vi } from 'vitest';
import { runProspectSiteAudit } from '@/lib/services/prospect-site-audit';

describe('prospect audit orchestration', () => {
  it('uses robots restrictions, bounded same-site pages and records no customer claims', async () => {
    const fetch = vi.fn(async (url: string) => {
      if (url.endsWith('/robots.txt')) return { finalUrl: url, status: 200, contentType: 'text/plain', body: 'User-agent: *\nDisallow: /products/' };
      if (url.endsWith('/')) return { finalUrl: url, status: 200, contentType: 'text/html', body: '<html><head></head><body><a href="/products/bag">bag</a><a href="/pages/contact">Contact</a><script src="https://cdn.shopify.com/s/a.js"></script></body></html>' };
      if (url.endsWith('/pages/contact')) return { finalUrl: url, status: 200, contentType: 'text/html', body: '<html><body><a href="mailto:hello@shop.co.il">email</a></body></html>' };
      throw new Error('Unexpected URL ' + url);
    });
    const pause = vi.fn(async () => {});
    const result = await runProspectSiteAudit('https://shop.co.il', { fetch, pause });
    expect(result.platform).toBe('shopify');
    expect(result.scannedUrls).toContain('https://shop.co.il/pages/contact');
    expect(result.skippedUrls).toContain('https://shop.co.il/products/bag');
    expect(result.contacts[0].business_email).toBe('hello@shop.co.il');
    expect(result.findings[0].observed_url).toBe('https://shop.co.il/');
    expect(result.findings[0]).not.toHaveProperty('verificationStatus');
    expect(fetch.mock.calls.length).toBe(3);
    expect(pause).toHaveBeenCalledTimes(2);
  });

  it('fails closed if robots cannot be fetched or returns error', async () => {
    const fetch = vi.fn(async (url: string) => ({ finalUrl: url, status: 403, body: 'No', contentType: 'text/plain' }));
    await expect(runProspectSiteAudit('https://shop.co.il', { fetch, pause: async () => {} }))
      .rejects.toThrow('SCAN_ROBOTS_UNAVAILABLE');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});