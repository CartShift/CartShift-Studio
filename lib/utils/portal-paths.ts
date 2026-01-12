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
  '/review',
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
 * Generate portal URL path.
 * Always returns /portal/... prefix for SSR consistency.
 * The PortalSubdomainRedirect component handles cleanup on subdomain.
 */
export function getPortalPath(path: string): string {
  let normalized = path
    .replace(/^\/[a-z]{2}\//, '/') // Remove locale prefix
    .replace(/^\/portal\//, '/')   // Remove /portal/ prefix
    .replace(/^\/portal$/, '/');

  if (!normalized.startsWith('/')) normalized = '/' + normalized;
  if (!normalized.endsWith('/') && !normalized.includes('?')) normalized += '/';

  // Always return /portal/... for consistency and stability.
  // We rely on Firebase hosting rewrites for mapping but keep internal links explicit.
  return normalized === '/' ? '/portal/' : `/portal${normalized}`;
}

export function usePortalPath() {
  return {
    getPath: getPortalPath,
    isSubdomain: isBrowser() ? isPortalSubdomain() : false,
  };
}
