'use client';

import { useEffect, useState } from 'react';
import { getSubdomainConfig } from '@/lib/utils/subdomain';

interface SubdomainState {
  isPortalSubdomain: boolean;
  isMainDomain: boolean;
  isDevelopment: boolean;
  isLoading: boolean;
}

/**
 * Hook to detect subdomain context.
 * All routing/redirects are handled by middleware - this is for UI state only.
 */
export function useSubdomain(): SubdomainState {
  const [state, setState] = useState<SubdomainState>({
    isPortalSubdomain: false,
    isMainDomain: false,
    isDevelopment: false,
    isLoading: true,
  });

  useEffect(() => {
    const config = getSubdomainConfig();
    setState({
      isPortalSubdomain: config.isPortalSubdomain,
      isMainDomain: config.isMainDomain,
      isDevelopment: config.isDevelopment,
      isLoading: false,
    });
  }, []);

  return state;
}

export function usePortalSubdomain() {
  return useSubdomain();
}
