/**
 * Portal Path Utilities
 *
 * Centralized configuration for portal paths and domain-aware URL generation.
 * This ensures consistent navigation behavior across both:
 * - cart-shift.com/portal/... (main domain)
 * - portal.cart-shift.com/... (subdomain)
 */

import { isPortalSubdomain, isBrowser } from './subdomain';

/**
 * List of all portal page path segments (without locale or /portal/ prefix)
 * Used for subdomain detection and routing
 */
export const PORTAL_PATHS = [
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
] as const;

export type PortalPath = (typeof PORTAL_PATHS)[number];

/**
 * Check if a path (without locale) is a portal page
 */
export function isPortalPath(pathWithoutLocale: string): boolean {
  const normalizedPath = pathWithoutLocale.replace(/\/$/, '') || '/';
  return PORTAL_PATHS.some(
    portalPath => normalizedPath === portalPath || normalizedPath.startsWith(portalPath + '/')
  );
}

/**
 * Generate the correct portal URL based on current domain context
 *
 * @param path - Path with or without /portal/ prefix (e.g., '/portal/dashboard/' or '/dashboard/')
 * @param locale - Optional locale (defaults to 'en')
 * @returns The correct URL for the current domain context
 *
 * @example
 * // On main domain (cart-shift.com):
 * getPortalPath('/dashboard/') // => '/portal/dashboard/'
 * getPortalPath('/portal/dashboard/') // => '/portal/dashboard/'
 *
 * // On portal subdomain (portal.cart-shift.com):
 * getPortalPath('/dashboard/') // => '/dashboard/'
 * getPortalPath('/portal/dashboard/') // => '/dashboard/'
 *
 * NOTE: This function returns paths WITHOUT locale prefix.
 * When using with next-intl's Link component, the locale is added automatically.
 * When using with router.push(), pass the result directly - it works with relative paths.
 */
export function getPortalPath(path: string, _locale?: string): string {
  // Normalize: remove /portal/ prefix and locale for processing
  let normalizedPath = path;

  // Remove locale prefix if present (e.g., /en/portal/dashboard -> /portal/dashboard)
  const localeMatch = normalizedPath.match(/^\/([a-z]{2})\/(.*)/);
  if (localeMatch) {
    normalizedPath = '/' + localeMatch[2];
  }

  // Remove /portal/ prefix if present
  if (normalizedPath.startsWith('/portal/')) {
    normalizedPath = normalizedPath.replace('/portal/', '/');
  } else if (normalizedPath === '/portal' || normalizedPath === '/portal/') {
    normalizedPath = '/';
  }

  // Ensure trailing slash for consistency (but preserve query strings)
  if (!normalizedPath.endsWith('/') && !normalizedPath.includes('?')) {
    normalizedPath = normalizedPath + '/';
  }

  // On portal subdomain: use paths without /portal/ prefix
  if (isBrowser() && isPortalSubdomain()) {
    if (normalizedPath === '/') {
      return '/dashboard/';
    }
    return normalizedPath;
  }

  // On main domain or SSR: use /portal/ prefix (without locale - Link adds it)
  if (normalizedPath === '/') {
    return '/portal/';
  }
  return `/portal${normalizedPath}`;
}

/**
 * Hook-compatible function to get portal path
 * Use this in components where you need reactive URL generation
 */
export function usePortalPath() {
  return {
    getPath: getPortalPath,
    isSubdomain: isBrowser() ? isPortalSubdomain() : false,
  };
}
