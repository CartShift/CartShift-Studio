import { describe, expect, it } from 'vitest';
import { germanMarketingEnabled, germanMarketingPaths, isGermanMarketingPath } from '@/lib/i18n/german-routes';

describe('German marketing route allowlist', () => {
  it('covers the same public page families as English and Hebrew', () => {
    expect(germanMarketingPaths).toEqual([
      '/',
      '/about',
      '/contact',
      '/work',
      '/blog',
      '/solutions/seo',
      '/solutions/shopify',
      '/solutions/wordpress',
      '/services/shopify-conversion-optimization',
      '/services/shopify-b2b-integrations',
      '/services/shopify-performance-seo',
      '/services/shopify-subscriptions',
      '/services/wordpress-security',
      '/free-store-review',
      '/tools',
      '/tools/client-portal',
      '/tools/store-analyzer',
      '/privacy',
      '/terms',
      '/pricing',
      '/maintenance',
    ]);
  });

  it('supports trailing slashes on approved paths', () => {
    expect(isGermanMarketingPath('/')).toBe(true);
    expect(isGermanMarketingPath('')).toBe(true);
    expect(isGermanMarketingPath('/contact/')).toBe(true);
    expect(isGermanMarketingPath('/solutions/seo')).toBe(true);
  });

  it('requires translation, legal review and public launch approval switches', () => {
    const oldEnabled = process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
    const oldReady = process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
    const oldLegal = process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED;
    const oldEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    try {
      delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
      delete process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
      delete process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED;
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'false';
      process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = 'true';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = 'true';
      expect(germanMarketingEnabled()).toBe(false);
      process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED = 'true';
      expect(germanMarketingEnabled()).toBe(true);
    } finally {
      if (oldEnabled === undefined) delete process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED;
      else process.env.NEXT_PUBLIC_GERMAN_MARKETING_ENABLED = oldEnabled;
      if (oldReady === undefined) delete process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED;
      else process.env.NEXT_PUBLIC_GERMAN_TRANSLATIONS_REVIEWED = oldReady;
      if (oldLegal === undefined) delete process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED;
      else process.env.NEXT_PUBLIC_GERMAN_LEGAL_APPROVED = oldLegal;
      if (oldEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = oldEnv;
    }
  });

  it('keeps all published editorial and industry routes on the same page tree', () => {
    for (const path of [
      '/blog/shopify-seo',
      '/work/i-love-my-honeypot-eco-ecommerce',
      '/industries/fashion',
      '/services/shopify-b2b-integrations',
      '/tools/store-analyzer/performance',
    ]) expect(isGermanMarketingPath(path)).toBe(true);
  });

  it('excludes private accounts, reports, unreviewed insights and personal portfolios', () => {
    for (const path of [
      '/portal',
      '/portal/login',
      '/tools/store-analyzer/report/private-token',
      '/audit-insights/unreviewed-user-content',
      '/yotam',
      '/portfolio/personal-project',
    ]) expect(isGermanMarketingPath(path)).toBe(false);
  });
});
