import { describe, expect, it } from 'vitest';
import { assertProspectNetworkUrl } from '@/lib/services/prospect-safe-http';

describe('prospect HTTP network boundary', () => {
  it('accepts only HTTPS on the exact source storefront canonical hostname', () => {
    const home = assertProspectNetworkUrl('https://www.shop.co.il/pages/about', 'shop.co.il');
    expect(home.hostname).toBe('www.shop.co.il');
    expect(assertProspectNetworkUrl('https://shop.co.il/robots.txt', 'www.shop.co.il').pathname)
      .toBe('/robots.txt');
  });

  it.each([
    'http://shop.co.il/pages/about',
    'https://shop.co.il:8443/',
    'https://localhost/',
    'https://127.0.0.1/admin',
    'https://169.254.169.254/latest',
    'https://shop.co.il@evil.co.il/',
    'https://evil.shop.co.il/',
    'https://shop.co.il.evil.com/',
    'https://shop.co.il/pages/contact#fragment',
  ])('rejects unsafe or cross-site fetch URL %s', url => {
    expect(() => assertProspectNetworkUrl(url, 'shop.co.il')).toThrow('SCAN_URL_NOT_ALLOWED');
  });
});