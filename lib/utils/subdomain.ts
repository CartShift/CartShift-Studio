/**
 * Subdomain Utilities (Client-side only)
 * Minimal utilities for UI adjustments based on subdomain context.
 * All routing/redirects are handled by middleware.
 */

const MAIN_DOMAIN = 'cart-shift.com';
const PORTAL_SUBDOMAIN = 'portal';
const PORTAL_FULL_DOMAIN = `${PORTAL_SUBDOMAIN}.${MAIN_DOMAIN}`;
const DEV_DOMAINS = ['localhost', '127.0.0.1'];

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getHostname(): string {
  return isBrowser() ? window.location.hostname : '';
}

function isDevelopment(): boolean {
  return DEV_DOMAINS.some(dev => getHostname().includes(dev));
}

export function isPortalSubdomain(): boolean {
  if (!isBrowser() || isDevelopment()) return false;
  const hostname = getHostname();
  return hostname === PORTAL_FULL_DOMAIN || hostname.startsWith(`${PORTAL_SUBDOMAIN}.`);
}

export function isMainDomain(): boolean {
  if (!isBrowser()) return false;
  if (isDevelopment()) return true;
  const hostname = getHostname();
  return hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;
}

export function getSubdomainConfig() {
  return {
    mainDomain: MAIN_DOMAIN,
    portalFullDomain: PORTAL_FULL_DOMAIN,
    isPortalSubdomain: isPortalSubdomain(),
    isMainDomain: isMainDomain(),
    isDevelopment: isDevelopment(),
  };
}
