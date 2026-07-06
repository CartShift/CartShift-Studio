export type AppLocale = 'en' | 'he';

export function resolveRequestLocale(options: {
  cookieLocale?: string | null;
  countryCode?: string | null;
  acceptLanguage?: string | null;
  defaultLocale?: AppLocale;
}): AppLocale {
  const defaultLocale = options.defaultLocale ?? 'en';

  if (options.cookieLocale === 'he' || options.cookieLocale === 'en') {
    return options.cookieLocale;
  }

  if (options.countryCode === 'IL') {
    return 'he';
  }

  if (options.acceptLanguage && /\bhe(?:[-_;,\s]|$)/i.test(options.acceptLanguage)) {
    return 'he';
  }

  return defaultLocale;
}

export function buildLocalizedBlogRedirectPath(
  pathname: string,
  locale: AppLocale
): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];

  if (first && (first === 'en' || first === 'he')) {
    return null;
  }

  if (first !== 'blog') {
    return null;
  }

  return `/${locale}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}
