import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // 1. Skip if it's localhost or internal Next.js/Firebase path
  const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (
    isDev ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/__') // Firebase auth
  ) {
    return intlMiddleware(request);
  }

  const isPortalSubdomain = hostname.startsWith('portal.cart-shift.com');

  // 2. Handle main domain -> portal subdomain redirect
  // If user visits cart-shift.com/en/portal/... redirect to portal.cart-shift.com/en/...
  if (!isPortalSubdomain && pathname.includes('/portal/')) {
    const newPathname = pathname.replace('/portal/', '/') || '/';
    return NextResponse.redirect(new URL(newPathname, `https://portal.cart-shift.com`));
  }

  // 3. Handle portal subdomain -> internal mapping
  if (isPortalSubdomain) {
    const pathParts = pathname.split('/');
    const hasLocale = routing.locales.includes(pathParts[1] as any);

    // If they access portal.cart-shift.com/en/portal/... redirect to clean URL /en/...
    if (hasLocale && pathParts[2] === 'portal') {
      const cleanPath = `/${pathParts[1]}/${pathParts.slice(3).join('/')}`;
      return NextResponse.redirect(new URL(cleanPath, request.url));
    }

    // Internally rewrite to /portal folder
    if (hasLocale && pathParts[2] !== 'portal') {
      const locale = pathParts[1];
      const rest = pathParts.slice(2).join('/');
      request.nextUrl.pathname = `/${locale}/portal/${rest}`;
    } else if (!hasLocale && !pathname.startsWith('/portal')) {
      request.nextUrl.pathname = `/portal${pathname === '/' ? '' : pathname}`;
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Exclude: api, _next, _vercel, __ (Firebase auth), and files with extensions
  matcher: ['/((?!api|_next|_vercel|__|.*\\..*).*)']
};
