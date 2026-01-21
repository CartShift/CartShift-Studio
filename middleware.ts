import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Toggle subdomain functionality - set to false to disable portal subdomain routing
const ENABLE_PORTAL_SUBDOMAIN = true;

export default function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // 1. Skip internal paths
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/__')
  ) {
    return intlMiddleware(request);
  }

  // 2. Check if we're on the portal subdomain
  const isPortalSubdomain =
    ENABLE_PORTAL_SUBDOMAIN &&
    (hostname.startsWith('portal.cart-shift.com') || hostname.startsWith('portal.localhost'));

  // 3. Main domain: redirect /portal/ paths to subdomain
  if (ENABLE_PORTAL_SUBDOMAIN && !isPortalSubdomain && pathname.includes('/portal/')) {
    const newPathname = pathname.replace('/portal/', '/') || '/';
    const redirectUrl = new URL(newPathname, `https://portal.cart-shift.com`);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. Portal subdomain: rewrite all paths to /portal/
  if (isPortalSubdomain) {
    // Check if path already contains /portal/ to avoid double-rewriting
    if (pathname.includes('/portal/') || pathname.includes('/portal')) {
      // Already has /portal, redirect to clean URL
      const cleanPath = pathname.replace(/\/portal\/?/, '/') || '/';
      if (cleanPath !== pathname) {
        return NextResponse.redirect(new URL(cleanPath, request.url));
      }
      return intlMiddleware(request);
    }

    // Rewrite: /en/dashboard -> /en/portal/dashboard
    const pathParts = pathname.split('/').filter(Boolean);
    const hasLocale = pathParts[0] && routing.locales.includes(pathParts[0] as 'en' | 'he');

    let rewritePath: string;
    if (hasLocale) {
      const locale = pathParts[0];
      const rest = pathParts.slice(1).join('/');
      rewritePath = `/${locale}/portal/${rest}`;
    } else {
      // No locale - let intl middleware handle adding it, but prepend portal
      rewritePath = `/portal${pathname === '/' ? '' : pathname}`;
    }

    // Ensure trailing slash consistency
    if (pathname.endsWith('/') && !rewritePath.endsWith('/')) {
      rewritePath += '/';
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewritePath;
    return NextResponse.rewrite(rewriteUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude: api, _next, _vercel, __ (Firebase auth), and files with extensions
  matcher: ['/((?!api|_next|_vercel|__|.*\\..*).*)'],
};
