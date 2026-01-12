'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { PORTAL_PATHS, isPortalPath } from '@/lib/utils/portal-paths';

// Configuration
const PORTAL_SUBDOMAIN_HOSTNAME = 'portal.cart-shift.com';
const DEV_HOSTNAMES = ['localhost', '127.0.0.1'];

/**
 * Redirects users on the portal subdomain to the appropriate portal pages.
 *
 * When someone visits portal.cart-shift.com/en/ (homepage), they should be
 * redirected to the portal dashboard, not see the marketing website.
 *
 * This component should be placed in the root layout to catch all routes.
 *
 * Behavior:
 * - On portal subdomain + non-portal page → redirect to /dashboard/
 * - On portal subdomain + legacy /portal/* path → strip /portal/ prefix
 * - On portal subdomain + portal page → no action (correct path)
 * - On main domain or localhost → no action
 */
export function PortalSubdomainRedirect() {
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Prevent double redirects
    if (hasRedirectedRef.current) return;

    if (typeof window === 'undefined') {
      return;
    }

    const hostname = window.location.hostname;

    // Skip for localhost/development
    const isDevelopment = DEV_HOSTNAMES.some(
      (dev) => hostname === dev || hostname.includes(dev)
    );

    if (isDevelopment) {
      return;
    }

    // Check if we're on the portal subdomain
    const isOnPortalSubdomain =
      hostname === PORTAL_SUBDOMAIN_HOSTNAME || hostname.startsWith('portal.');

    if (!isOnPortalSubdomain) {
      return;
    }

    // We're on the portal subdomain - determine the correct action
    const pathWithoutLocale = pathname?.replace(/^\/[a-z]{2}\//, '/') || '/';
    const pathNormalized = pathWithoutLocale.replace(/\/$/, '') || '/';

    // Check if we're on a legacy /portal/* path
    const isLegacyPortalPath =
      pathname?.includes('/portal/') || pathname?.endsWith('/portal');

    if (isLegacyPortalPath) {
      // Strip the /portal prefix and redirect
      hasRedirectedRef.current = true;
      const newPath = pathname!
        .replace(/\/portal\//, '/')
        .replace(/\/portal$/, '/');
      window.location.replace(newPath); // Use replace for cleaner history
      return;
    }

    // Check if current path is a valid portal page
    const isValidPortalPage = isPortalPath(pathNormalized);

    if (isValidPortalPage) {
      // Already on a valid portal page, no redirect needed
      return;
    }

    // Not a portal page - redirect to dashboard
    // Extract locale from current path or default to 'en'
    const localeMatch = pathname?.match(/^\/([a-z]{2})\//);
    const locale = localeMatch ? localeMatch[1] : 'en';

    hasRedirectedRef.current = true;
    window.location.replace(`/${locale}/dashboard/`); // Use replace for cleaner history
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
