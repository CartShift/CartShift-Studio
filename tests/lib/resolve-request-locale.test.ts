import { describe, expect, it } from 'vitest';
import {
  buildLocalizedBlogRedirectPath,
  resolveRequestLocale,
} from '@/lib/i18n/resolve-request-locale';

describe('resolveRequestLocale', () => {
  it('prefers NEXT_LOCALE cookie', () => {
    expect(
      resolveRequestLocale({
        cookieLocale: 'he',
        countryCode: 'US',
        acceptLanguage: 'en-US',
      })
    ).toBe('he');
  });

  it('uses Israel geo when no cookie', () => {
    expect(
      resolveRequestLocale({
        countryCode: 'IL',
        acceptLanguage: 'en-US',
      })
    ).toBe('he');
  });

  it('uses Accept-Language Hebrew when no cookie or geo', () => {
    expect(
      resolveRequestLocale({
        acceptLanguage: 'he-IL,he;q=0.9,en;q=0.8',
      })
    ).toBe('he');
  });

  it('defaults to English', () => {
    expect(resolveRequestLocale({ acceptLanguage: 'en-US' })).toBe('en');
  });
});

describe('buildLocalizedBlogRedirectPath', () => {
  it('redirects unlocalized blog index', () => {
    expect(buildLocalizedBlogRedirectPath('/blog', 'en')).toBe('/en/blog');
    expect(buildLocalizedBlogRedirectPath('/blog', 'he')).toBe('/he/blog');
  });

  it('redirects unlocalized blog posts', () => {
    expect(buildLocalizedBlogRedirectPath('/blog/shopify-seo-complete-guide', 'he')).toBe(
      '/he/blog/shopify-seo-complete-guide'
    );
  });

  it('skips already localized paths', () => {
    expect(buildLocalizedBlogRedirectPath('/en/blog/foo', 'he')).toBeNull();
    expect(buildLocalizedBlogRedirectPath('/he/blog/foo', 'en')).toBeNull();
  });

  it('skips non-blog paths', () => {
    expect(buildLocalizedBlogRedirectPath('/about', 'he')).toBeNull();
  });
});
