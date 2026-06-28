import type { Pathnames } from 'next-intl/routing';

export const appLocales = ['en', 'he'] as const;

const websitePathnames = [
  '/',
  '/about',
  '/blog',
  '/blog/[slug]',
  '/contact',
  '/pricing',
  '/privacy',
  '/terms',
  '/work',
  '/work/[slug]',
  '/tools',
  '/tools/client-portal',
  '/tools/store-analyzer',
  '/solutions/shopify',
  '/solutions/wordpress',
  '/industries/[industry]',
  '/maintenance',
] as const;

const portalPathnames = [
  '/portal',
  '/portal/dashboard',
  '/portal/requests',
  '/portal/requests/new',
  '/portal/requests/[requestId]',
  '/portal/team',
  '/portal/files',
  '/portal/pricing',
  '/portal/pricing/new',
  '/portal/pricing/[pricingId]',
  '/portal/pricing/[pricingId]/edit',
  '/portal/settings',
  '/portal/consultations',
  '/portal/review',
  '/portal/help',
  '/portal/login',
  '/portal/signup',
  '/portal/forgot-password',
  '/portal/dev-login',
  '/portal/oauth-callback',
  '/portal/invite/[code]',
  '/portal/agency',
  '/portal/agency/workboard',
  '/portal/agency/sales',
  '/portal/agency/leads',
  '/portal/agency/clients',
  '/portal/agency/clients/new',
  '/portal/agency/clients/[clientId]',
  '/portal/agency/clients/template',
  '/portal/agency/consultations',
  '/portal/agency/pricing',
  '/portal/agency/testimonials',
  '/portal/agency/settings',
  '/portal/agency/help',
  '/portal/agency/email-preview',
  '/portal/agency/calculator',
] as const;

const standalonePathnames = [
  '/cv',
  '/proposal/[token]',
  '/proposal/[token]/payment/[paymentToken]',
] as const;

const allPathnames = [
  ...websitePathnames,
  ...portalPathnames,
  ...standalonePathnames,
] as const;

export type AppPathname = (typeof allPathnames)[number];

export const pathnames: Pathnames<typeof appLocales> = Object.fromEntries(
  allPathnames.map(pathname => [pathname, pathname])
) as Pathnames<typeof appLocales>;
