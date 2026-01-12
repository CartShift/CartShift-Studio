import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Configuration
const MAIN_DOMAIN = 'cart-shift.com';
const PORTAL_SUBDOMAIN = 'portal.cart-shift.com';
const DEV_HOSTS = ['localhost', '127.0.0.1'];

// Portal page paths (without locale or /portal/ prefix)
const PORTAL_PAGES = [
  '/dashboard',
  '/requests',
  '/team',
  '/files',
  '/pricing',
  '/settings',
  '/consultations',
  '/agency',
  '/login',
  '/signup',
  '/oauth-callback',
  '/invite',
];

function isPortalPage(pathWithoutLocale: string): boolean {
  const normalized = pathWithoutLocale.replace(/\/$/, '') || '/';
  return PORTAL_PAGES.some(p => normalized === p || normalized.startsWith(p + '/'));
}

function extractLocale(pathname: string): { locale: string; pathAfterLocale: string } {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (match) {
    return { locale: match[1], pathAfterLocale: match[2] || '/' };
  }
  return { locale: '', pathAfterLocale: pathname };
}

export default function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Skip subdomain logic in development
  const isDev = DEV_HOSTS.some(dev => hostname.includes(dev));
  if (isDev) {
    return intlMiddleware(request);
  }

  // Check if we're on the portal subdomain
  const isPortalSubdomain = hostname === PORTAL_SUBDOMAIN || hostname.endsWith(`.${PORTAL_SUBDOMAIN}`);

  if (isPortalSubdomain) {
    const { locale, pathAfterLocale } = extractLocale(pathname);

    // Case 1: Legacy /portal/* path on subdomain → redirect to strip /portal/
    const hasPortalPrefix = /^(\/[a-z]{2})?\/portal(\/|$)/.test(pathname);
    if (hasPortalPrefix) {
      const cleanPath = pathname
        .replace(/^(\/[a-z]{2})\/portal/, '$1')
        .replace(/^\/portal/, '')
        || '/';
      return NextResponse.redirect(new URL(cleanPath, request.url));
    }

    // Case 2: Non-portal page on subdomain (e.g., homepage) → redirect to dashboard
    const pathToCheck = pathAfterLocale.replace(/\/$/, '') || '/';
    if (pathToCheck === '/' || (!isPortalPage(pathToCheck) && !pathname.includes('/_next'))) {
      const dashboardPath = locale ? `/${locale}/dashboard/` : '/en/dashboard/';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Case 3: Valid portal page on subdomain → rewrite to internal /portal/* route
    const rewritePath = locale
      ? `/${locale}/portal${pathAfterLocale}`
      : `/portal${pathname}`;
    return NextResponse.rewrite(new URL(rewritePath, request.url));
  }

  // Main domain: proceed with normal intl middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
