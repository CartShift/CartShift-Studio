import { describe, expect, it } from 'vitest';
import { germanMarketingEnabled, germanMarketingPaths, isGermanMarketingPath } from '@/lib/i18n/german-routes';

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

  it('requires both explicit readiness and enablement switches', () => {
    const oldEnabled = process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
    const oldReady = process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
    const oldEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    try {
      delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
      delete process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'false';
      process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
      expect(germanMarketingEnabled()).toBe(true);
    } finally {
      if (oldEnabled === undefined) delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
      else process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = oldEnabled;
      if (oldReady === undefined) delete process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
      else process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = oldReady;
      if (oldEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = oldEnv;
    }
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
