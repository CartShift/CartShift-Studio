'use client';

import { useEffect, useState } from 'react';
import { isPortalSubdomain as checkIsPortalSubdomain } from '@/lib/utils/subdomain';

interface SubdomainHandlerProps {
  children: React.ReactNode;
}

/**
 * Wrapper for portal pages. All routing logic is handled by the root proxy.
 * This component now only provides subdomain context.
 */
export function SubdomainHandler({ children }: SubdomainHandlerProps) {
  return <>{children}</>;
}

/**
 * Hook for portal-specific UI adjustments based on subdomain context.
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
    showFullBranding: !isPortalSubdomain,
    isPortalPrimary: isPortalSubdomain,
  };
}
