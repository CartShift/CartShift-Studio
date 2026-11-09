import { describe, expect, it } from 'vitest';
import { germanMarketingPaths, isGermanMarketingPath } from '@/lib/i18n/german-routes';

describe('German marketing route allowlist', () => {
  it('only contains reviewed public paths', () => {
    expect(germanMarketingPaths).toEqual([
      '/',
      '/contact',
      '/about',
      '/work',
      '/solutions/seo',
      '/solutions/shopify',
      '/solutions/wordpress',
    ]);
  });

  it('supports trailing slashes on approved paths', () => {
    expect(isGermanMarketingPath('/')).toBe(true);
    expect(isGermanMarketingPath('')).toBe(true);
    expect(isGermanMarketingPath('/contact/')).toBe(true);
    expect(isGermanMarketingPath('/solutions/seo')).toBe(true);
  });

  it('excludes untranslated or private pages', () => {
    for (const path of [
      '/blog',
      '/blog/shopify-seo',
      '/work/i-love-my-honeypot-eco-ecommerce',
      '/portal',
      '/portal/login',
      '/terms',
      '/privacy',
      '/yotam',
      '/free-store-review',
      '/services/shopify-subscriptions',
    ]) expect(isGermanMarketingPath(path)).toBe(false);
  });
});
