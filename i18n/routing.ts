import { defineRouting } from 'next-intl/routing';
import { appLocales, pathnames } from './pathnames';

export const routing = defineRouting({
  locales: appLocales,
  defaultLocale: 'en',
  localePrefix: 'always',
  pathnames,
});

export type AppLocale = (typeof routing.locales)[number];
