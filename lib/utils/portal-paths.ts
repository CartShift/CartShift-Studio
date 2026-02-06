/**
 * Portal Path Utilities
 * Centralized path configuration and domain-aware URL generation.
 */

import { isPortalSubdomain, isMainDomain, isBrowser } from './subdomain';

export const PORTAL_PATHS = [
  '/dashboard',
  '/requests',
  '/team',
  '/files',
  '/pricing',
  '/settings',
  '/consultations',
  '/review',
  '/agency',
  '/login',
  '/signup',
  '/oauth-callback',
  '/invite',
] as const;

export type PortalPath = (typeof PORTAL_PATHS)[number];

const PORTAL_SUBDOMAIN_URL = 'https://portal.cart-shift.com';

export function isPortalPath(pathWithoutLocale: string): boolean {
  const normalized = pathWithoutLocale.replace(/\/$/, '') || '/';
  return PORTAL_PATHS.some(p => normalized === p || normalized.startsWith(p + '/'));
}

/**
 * Generate portal URL path.
 * - On main domain (cart-shift.com): Returns full subdomain URL (https://portal.cart-shift.com/...)
 * - On portal subdomain: Returns relative path (/dashboard/, /requests/, etc.)
 * - In development: Returns /portal/... for local routing
 */
export function getPortalPath(path: string, locale?: string): string {
  let normalized = path
    .replace(/^\/[a-z]{2}\//, '/') // Remove locale prefix
    .replace(/^\/portal\//, '/') // Remove /portal/ prefix
    .replace(/^\/portal$/, '/');

  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (!normalized.endsWith('/') && !normalized.includes('?')) normalized += '/';

  // Determine the current locale
  const currentLocale = locale || (isBrowser() ? getLocaleFromPath() : 'en');

  // On main domain in production: redirect to subdomain
  if (isBrowser() && isMainDomain()) {
    const localePath = `/${currentLocale}${normalized === '/' ? '' : normalized}`;
    return `${PORTAL_SUBDOMAIN_URL}${localePath}`;
  }

  // On portal subdomain: use relative paths (no /portal/ prefix)
  if (isBrowser() && isPortalSubdomain()) {
    return normalized;
  }

  // In development or SSR: use /portal/... paths for Next.js routing
  return normalized === '/' ? '/portal/' : `/portal${normalized}`;
}

/**
 * Get the full portal subdomain URL for external use (emails, sharing, etc.)
 */
export function getPortalSubdomainUrl(path: string, locale: string = 'en'): string {
  let normalized = path
    .replace(/^\/[a-z]{2}\//, '/')
    .replace(/^\/portal\//, '/')
    .replace(/^\/portal$/, '/');

  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (!normalized.endsWith('/') && !normalized.includes('?')) normalized += '/';

  return `${PORTAL_SUBDOMAIN_URL}/${locale}${normalized === '/' ? '' : normalized}`;
}

/**
 * Extract locale from current path
 */
function getLocaleFromPath(): string {
  if (!isBrowser()) return 'en';
  const match = window.location.pathname.match(/^\/([a-z]{2})\//);
  return match ? match[1] : 'en';
}

/**
 * Full pathname for same-origin redirect (e.g. after login).
 * Use with window.location.assign() so the new page loads with the session cookie.
 */
export function getPortalPathnameForRedirect(path: string, locale: string): string {
  const segment = getPortalPath(path);
  if (segment.startsWith('http')) return segment;
  return `/${locale}${segment}`;
}

export function usePortalPath() {
  return {
    getPath: getPortalPath,
    getSubdomainUrl: getPortalSubdomainUrl,
    isSubdomain: isBrowser() ? isPortalSubdomain() : false,
  };
}
