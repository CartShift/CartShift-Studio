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

  it('keeps German disabled by default and never enables it for production', () => {
    const oldFlag = process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
    const oldEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const oldRef = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;
    try {
      delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF = 'feat/german-market-launch-20261109';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
      expect(germanMarketingEnabled()).toBe(true);
      process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF = 'main';
      expect(germanMarketingEnabled()).toBe(false);
    } finally {
      if (oldFlag === undefined) delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
      else process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = oldFlag;
      if (oldEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = oldEnv;
      if (oldRef === undefined) delete process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;
      else process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF = oldRef;
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
