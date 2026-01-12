'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  getPortalBasePath,
  getSubdomainConfig,
  redirectToPortalSubdomain,
  redirectToMainDomain,
} from '@/lib/utils/subdomain';

interface SubdomainState {
  isPortalSubdomain: boolean;
  isMainDomain: boolean;
  isDevelopment: boolean;
  portalBasePath: string;
  isLoading: boolean;
}

/**
 * Hook to detect and handle subdomain routing
 *
 * @param options.redirectToSubdomain - If true, redirect /portal/* routes to portal.cart-shift.com
 * @param options.redirectNonPortalToMain - If true, redirect non-portal pages from subdomain to main domain
 */
export function useSubdomain(
  options: {
    redirectToSubdomain?: boolean;
    redirectNonPortalToMain?: boolean;
  } = {}
): SubdomainState {
  const pathname = usePathname();
  const [state, setState] = useState<SubdomainState>({
    isPortalSubdomain: false,
    isMainDomain: false,
    isDevelopment: false,
    portalBasePath: '/portal/',
    isLoading: true,
  });

  useEffect(() => {
    // Get subdomain configuration
    const config = getSubdomainConfig();

    setState({
      isPortalSubdomain: config.isPortalSubdomain,
      isMainDomain: config.isMainDomain,
      isDevelopment: config.isDevelopment,
      portalBasePath: getPortalBasePath(),
      isLoading: false,
    });

    // Handle redirects if enabled
    if (options.redirectToSubdomain && pathname) {
      redirectToPortalSubdomain(pathname);
    }

    if (options.redirectNonPortalToMain && pathname) {
      redirectToMainDomain(pathname);
    }
  }, [pathname, options.redirectToSubdomain, options.redirectNonPortalToMain]);

  return state;
}

/**
 * Hook specifically for portal pages to handle subdomain-aware navigation
 * This is a convenience wrapper around useSubdomain
 */
export function usePortalSubdomain() {
  return useSubdomain({
    // Enable redirect to subdomain for better UX (optional - can be disabled)
    redirectToSubdomain: false, // Set to true to auto-redirect to subdomain
    redirectNonPortalToMain: false,
  });
}
