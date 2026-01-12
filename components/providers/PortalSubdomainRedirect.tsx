'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const PORTAL_SUBDOMAIN_HOSTNAME = 'portal.cart-shift.com';
const DEV_HOSTNAMES = ['localhost', '127.0.0.1'];

/**
 * Cleans up URLs on portal subdomain by stripping legacy /portal/ prefix.
 *
 * Since static export generates links with /portal/ prefix (SSR can't detect subdomain),
 * this component redirects to clean URLs when user navigates on the subdomain.
 */
export function PortalSubdomainRedirect() {
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (hasRedirectedRef.current || typeof window === 'undefined') return;

    const hostname = window.location.hostname;
    const isDev = DEV_HOSTNAMES.some(dev => hostname === dev || hostname.includes(dev));
    if (isDev) return;

    const isOnSubdomain = hostname === PORTAL_SUBDOMAIN_HOSTNAME || hostname.startsWith('portal.');
    if (!isOnSubdomain) return;

    // Strip /portal/ prefix on subdomain for clean URLs
    const hasPortalPrefix = pathname?.includes('/portal/') || pathname?.endsWith('/portal');
    if (hasPortalPrefix) {
      hasRedirectedRef.current = true;
      const cleanPath = pathname!.replace(/\/portal\//, '/').replace(/\/portal$/, '/');
      window.location.replace(cleanPath);
    }
  }, [pathname]);

  return null;
}
