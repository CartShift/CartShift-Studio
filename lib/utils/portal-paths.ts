/**
 * Portal Path Utilities
 * Centralized path configuration and domain-aware URL generation.
 */

import { isPortalSubdomain, isBrowser } from './subdomain';

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

export function isPortalPath(pathWithoutLocale: string): boolean {
  const normalized = pathWithoutLocale.replace(/\/$/, '') || '/';
  return PORTAL_PATHS.some(p => normalized === p || normalized.startsWith(p + '/'));
}

/**
 * Generate the correct portal URL based on current domain context.
 * On subdomain: /dashboard/, on main domain: /portal/dashboard/
 */
export function getPortalPath(path: string): string {
  let normalized = path
    .replace(/^\/[a-z]{2}\//, '/') // Remove locale prefix
    .replace(/^\/portal\//, '/')   // Remove /portal/ prefix
    .replace(/^\/portal$/, '/');

  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (!normalized.endsWith('/') && !normalized.includes('?')) normalized += '/';

  if (isBrowser() && isPortalSubdomain()) {
    return normalized === '/' ? '/dashboard/' : normalized;
  }

  return normalized === '/' ? '/portal/' : `/portal${normalized}`;
}

export function usePortalPath() {
  return {
    getPath: getPortalPath,
    isSubdomain: isBrowser() ? isPortalSubdomain() : false,
  };
}
