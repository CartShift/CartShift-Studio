'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  isPortalSubdomain as checkIsPortalSubdomain,
} from '@/lib/utils/subdomain';

interface SubdomainHandlerProps {
  children: React.ReactNode;
}

/**
 * Component that handles subdomain-specific routing for portal pages.
 *
 * When on the portal subdomain (portal.cart-shift.com):
 * - Routes like /en/dashboard/ work directly (no /portal/ prefix needed)
 * - Legacy /portal/* paths are stripped
 *
 * When on the main domain (cart-shift.com):
 * - Routes like /en/portal/dashboard/ work as before
 */
export function SubdomainHandler({ children }: SubdomainHandlerProps) {
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Skip if we've already initiated a redirect
    if (hasRedirectedRef.current) return;

    if (typeof window === 'undefined') {
      setIsReady(true);
      return;
    }

    const isSubdomain = checkIsPortalSubdomain();

    // If not on subdomain, just render immediately
    if (!isSubdomain) {
      setIsReady(true);
      return;
    }

    // On portal subdomain: handle legacy /portal/* paths
    if (pathname?.includes('/portal/')) {
      hasRedirectedRef.current = true;
      const newPath = pathname.replace('/portal/', '/');
      window.location.replace(newPath);
      return;
    }

    // All good - render children
    setIsReady(true);
  }, [pathname]);

  // Show nothing while checking/redirecting to avoid flash
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Hook to check if we should show portal-specific UI adjustments
 * based on whether we're on the portal subdomain
 */
export function usePortalSubdomainUI() {
  const [isPortalSubdomain, setIsPortalSubdomain] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsPortalSubdomain(checkIsPortalSubdomain());
    setIsReady(true);
  }, []);

  return {
    isPortalSubdomain,
    isReady,
    // On subdomain, hide certain branding/marketing elements
    showFullBranding: !isPortalSubdomain,
    // On subdomain, portal is the "main" experience
    isPortalPrimary: isPortalSubdomain,
  };
}
