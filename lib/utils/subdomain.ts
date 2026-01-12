/**
 * Subdomain Utilities
 *
 * Handles detection and routing for portal.cart-shift.com subdomain.
 * This allows the portal to be accessed via both:
 * - cart-shift.com/portal/... (legacy)
 * - portal.cart-shift.com/... (preferred)
 */

// Configuration
const MAIN_DOMAIN = 'cart-shift.com';
const PORTAL_SUBDOMAIN = 'portal';
const PORTAL_FULL_DOMAIN = `${PORTAL_SUBDOMAIN}.${MAIN_DOMAIN}`;

// Development domains (localhost variations)
const DEV_DOMAINS = ['localhost', '127.0.0.1'];

/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Get the current hostname
 */
export function getHostname(): string {
  if (!isBrowser()) return '';
  return window.location.hostname;
}

/**
 * Check if we're on the portal subdomain (portal.cart-shift.com)
 */
export function isPortalSubdomain(): boolean {
  if (!isBrowser()) return false;

  const hostname = getHostname();

  // In development, treat localhost as main domain (not portal subdomain)
  if (DEV_DOMAINS.some((dev) => hostname.includes(dev))) {
    return false;
  }

  // Check if we're on the portal subdomain
  return hostname === PORTAL_FULL_DOMAIN || hostname.startsWith(`${PORTAL_SUBDOMAIN}.`);
}

/**
 * Check if we're on the main domain (cart-shift.com)
 */
export function isMainDomain(): boolean {
  if (!isBrowser()) return false;

  const hostname = getHostname();

  // In development, treat localhost as main domain
  if (DEV_DOMAINS.some((dev) => hostname.includes(dev))) {
    return true;
  }

  // Check if we're on the main domain (not a subdomain)
  return hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;
}

/**
 * Get the portal base URL based on environment and subdomain
 * - On portal subdomain: returns root (/)
 * - On main domain: returns /portal/
 * - In development: returns /portal/
 */
export function getPortalBasePath(): string {
  if (isPortalSubdomain()) {
    return '/';
  }
  return '/portal/';
}

/**
 * Get the full portal URL for a given path
 * Converts /portal/dashboard to the appropriate URL based on subdomain
 *
 * @param path - The portal path (e.g., '/portal/dashboard/' or '/dashboard/')
 * @param forceSubdomain - If true, always return subdomain URL
 */
export function getPortalUrl(path: string, forceSubdomain = false): string {
  if (!isBrowser()) return path;

  // Normalize path - remove /portal prefix if present
  let normalizedPath = path;
  if (normalizedPath.startsWith('/portal/')) {
    normalizedPath = normalizedPath.replace('/portal/', '/');
  } else if (normalizedPath.startsWith('/portal')) {
    normalizedPath = normalizedPath.replace('/portal', '/');
  }

  // Ensure path starts with /
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = '/' + normalizedPath;
  }

  // If on portal subdomain, use root-relative paths
  if (isPortalSubdomain()) {
    return normalizedPath;
  }

  // If force subdomain, build full subdomain URL
  if (forceSubdomain && !DEV_DOMAINS.some((dev) => getHostname().includes(dev))) {
    const protocol = window.location.protocol;
    return `${protocol}//${PORTAL_FULL_DOMAIN}${normalizedPath}`;
  }

  // Default: use /portal/ prefix on main domain
  if (normalizedPath === '/') {
    return '/portal/';
  }
  return `/portal${normalizedPath}`;
}

/**
 * Redirect to portal subdomain if on main domain /portal/* routes
 * Call this in portal pages to redirect users to the subdomain
 *
 * @param currentPath - The current pathname
 * @returns true if redirect was initiated, false otherwise
 */
export function redirectToPortalSubdomain(currentPath: string): boolean {
  if (!isBrowser()) return false;

  // Only redirect if:
  // 1. We're on the main domain (not already on subdomain)
  // 2. We're on a /portal/* route
  // 3. Not in development
  if (
    !isMainDomain() ||
    !currentPath.startsWith('/portal/') ||
    !currentPath.includes('/portal/') ||
    DEV_DOMAINS.some((dev) => getHostname().includes(dev))
  ) {
    return false;
  }

  // Build the subdomain URL
  const protocol = window.location.protocol;
  // Remove /portal prefix and locale handling
  let targetPath = currentPath;

  // Handle locale prefix: /en/portal/dashboard/ -> /en/dashboard/
  const localeMatch = currentPath.match(/^\/([a-z]{2})\/portal\/(.*)/);
  if (localeMatch) {
    targetPath = `/${localeMatch[1]}/${localeMatch[2]}`;
  } else if (currentPath.startsWith('/portal/')) {
    targetPath = currentPath.replace('/portal/', '/');
  }

  const targetUrl = `${protocol}//${PORTAL_FULL_DOMAIN}${targetPath}`;

  // Perform redirect
  window.location.href = targetUrl;
  return true;
}

/**
 * Redirect non-portal pages back to main domain when accessed from portal subdomain
 * Call this for non-portal pages to ensure they're accessed from the main domain
 *
 * @param currentPath - The current pathname
 * @returns true if redirect was initiated, false otherwise
 */
export function redirectToMainDomain(currentPath: string): boolean {
  if (!isBrowser()) return false;

  // Only redirect if we're on the portal subdomain and trying to access non-portal pages
  if (!isPortalSubdomain() || DEV_DOMAINS.some((dev) => getHostname().includes(dev))) {
    return false;
  }

  // Check if this is a portal page (should stay on subdomain)
  // Portal pages have paths like /en/dashboard/, /en/requests/, etc. (no /portal/ prefix on subdomain)
  // or auth pages like /en/login/, /en/signup/
  const portalPages = [
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

  // Check if current path (ignoring locale) is a portal page
  const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}\//, '/');
  const isPortalPage = portalPages.some(
    (page) => pathWithoutLocale.startsWith(page) || pathWithoutLocale === '/'
  );

  if (isPortalPage) {
    return false; // Stay on subdomain
  }

  // Redirect to main domain
  const protocol = window.location.protocol;
  const targetUrl = `${protocol}//${MAIN_DOMAIN}${currentPath}`;
  window.location.href = targetUrl;
  return true;
}

/**
 * Get configuration for subdomain setup
 */
export function getSubdomainConfig() {
  return {
    mainDomain: MAIN_DOMAIN,
    portalSubdomain: PORTAL_SUBDOMAIN,
    portalFullDomain: PORTAL_FULL_DOMAIN,
    isPortalSubdomain: isPortalSubdomain(),
    isMainDomain: isMainDomain(),
    isDevelopment: isBrowser() && DEV_DOMAINS.some((dev) => getHostname().includes(dev)),
  };
}
