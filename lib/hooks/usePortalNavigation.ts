'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { isPortalSubdomain, isBrowser } from '@/lib/utils/subdomain';
import { getPortalPath, PORTAL_PATHS } from '@/lib/utils/portal-paths';

/**
 * Hook for subdomain-aware portal navigation.
 */
export function usePortalNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (isBrowser()) setIsSubdomain(isPortalSubdomain());
  }, []);

  const getPortalHref = useCallback((path: string) => getPortalPath(path), []);

  const navigateToPortal = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      const target = getPortalPath(path);
      if (options?.replace) {
        router.replace(target);
      } else {
        router.push(target);
      }
    },
    [router]
  );

  const navigateToLogin = useCallback(
    (redirectAfterLogin?: string) => {
      const loginPath = getPortalPath('/login/');
      const url = redirectAfterLogin
        ? `${loginPath}?redirect=${encodeURIComponent(redirectAfterLogin)}`
        : loginPath;
      router.push(url);
    },
    [router]
  );

  const navigateToDashboard = useCallback(
    (options?: { replace?: boolean }) => navigateToPortal('/dashboard/', options),
    [navigateToPortal]
  );

  const isOnPortalPage = useCallback((): boolean => {
    if (!pathname) return false;
    const normalized =
      pathname
        .replace(/^\/[a-z]{2}\//, '/')
        .replace('/portal/', '/')
        .replace(/\/$/, '') || '/';
    return PORTAL_PATHS.some(p => normalized === p || normalized.startsWith(p + '/'));
  }, [pathname]);

  return {
    isSubdomain,
    getPortalHref,
    navigateToPortal,
    navigateToLogin,
    navigateToDashboard,
    isOnPortalPage,
  };
}
