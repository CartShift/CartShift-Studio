import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const ENABLE_PORTAL_SUBDOMAIN = true;
const SESSION_COOKIE = '__session';

const PORTAL_AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/oauth-callback', '/invite'];

function isPortalAuthPage(path: string): boolean {
  return PORTAL_AUTH_PAGES.some(p => path === p || path.startsWith(p + '/'));
}

function getPortalPathFromRequest(pathname: string, isSubdomain: boolean): string | null {
  const parts = pathname.split('/').filter(Boolean);
  const hasLocale = parts[0] && routing.locales.includes(parts[0] as 'en' | 'he');

  if (isSubdomain) {
    return '/' + (hasLocale ? parts.slice(1).join('/') : parts.join('/'));
  }

  if (hasLocale && parts[1] === 'portal') {
    return '/' + parts.slice(2).join('/');
  }
  if (parts[0] === 'portal') {
    return '/' + parts.slice(1).join('/');
  }

  return null;
}

function getLocaleFromPath(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0];
  return first && routing.locales.includes(first as 'en' | 'he') ? first : routing.defaultLocale;
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_vercel') ||
    pathname.startsWith('/__')
  ) {
    return NextResponse.next();
  }

  const isPortalSubdomain =
    ENABLE_PORTAL_SUBDOMAIN &&
    (hostname.startsWith('portal.cart-shift.com') || hostname.startsWith('portal.localhost'));

  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  if (
    ENABLE_PORTAL_SUBDOMAIN &&
    !isPortalSubdomain &&
    !isLocalhost &&
    pathname.includes('/portal/')
  ) {
    const newPathname = pathname.replace('/portal/', '/') || '/';
    const redirectUrl = new URL(newPathname, 'https://portal.cart-shift.com');
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (isPortalSubdomain) {
    if (pathname.includes('/portal/') || pathname.includes('/portal')) {
      const cleanPath = pathname.replace(/\/portal\/?/, '/') || '/';
      if (cleanPath !== pathname) {
        return NextResponse.redirect(new URL(cleanPath, request.url));
      }
      return intlMiddleware(request);
    }

    const locale = getLocaleFromPath(pathname);
    const portalPath = getPortalPathFromRequest(pathname, true) || '/';
    const hasSession = request.cookies.has(SESSION_COOKIE);

    if (isPortalAuthPage(portalPath) && hasSession) {
      return NextResponse.redirect(new URL(`/${locale}/`, request.url));
    }

    const pathParts = pathname.split('/').filter(Boolean);
    const hasLocale = pathParts[0] && routing.locales.includes(pathParts[0] as 'en' | 'he');

    let rewritePath: string;
    if (hasLocale) {
      const rest = pathParts.slice(1).join('/');
      rewritePath = `/${pathParts[0]}/portal/${rest}`;
    } else {
      rewritePath = `/${routing.defaultLocale}/portal${pathname === '/' ? '' : pathname}`;
    }

    if (pathname.endsWith('/') && !rewritePath.endsWith('/')) {
      rewritePath += '/';
    }

    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = rewritePath;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-is-portal-subdomain', '1');
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  }

  if (isLocalhost) {
    const portalPath = getPortalPathFromRequest(pathname, false);
    if (portalPath !== null) {
      const locale = getLocaleFromPath(pathname);
      const hasSession = request.cookies.has(SESSION_COOKIE);

      if (isPortalAuthPage(portalPath) && hasSession) {
        return NextResponse.redirect(new URL(`/${locale}/portal/`, request.url));
      }
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|__|.*\\..*).*)'],
};
