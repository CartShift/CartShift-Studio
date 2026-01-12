'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { isPortalSubdomain, isBrowser } from '@/lib/utils/subdomain';
import { getPortalPath, PORTAL_PATHS } from '@/lib/utils/portal-paths';

/**
 * Hook for subdomain-aware portal navigation
 *
 * Provides navigation functions that automatically adjust URLs based on
 * whether we're on the portal subdomain or main domain.
 *
 * @example
 * const { navigateToPortal, getPortalHref } = usePortalNavigation();
 *
 * // Navigate to dashboard (works on both domains)
 * navigateToPortal('/dashboard/');
 *
 * // Get href for Link component
 * <Link href={getPortalHref('/requests/')}>Requests</Link>
 */
export function usePortalNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (isBrowser()) {
      setIsSubdomain(isPortalSubdomain());
    }
  }, []);

  /**
   * Get the correct href for a portal path
   * Use this for Link components
   */
  const getPortalHref = useCallback((path: string): string => {
    return getPortalPath(path);
  }, []);

  /**
   * Navigate to a portal path
   * Automatically adjusts the path based on current domain
   */
  const navigateToPortal = useCallback(
    (path: string, options?: { replace?: boolean }) => {
      const targetPath = getPortalPath(path);

      if (options?.replace) {
        router.replace(targetPath);
      } else {
        router.push(targetPath);
      }
    },
    [router]
  );

  /**
   * Navigate to login page
   */
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

  /**
   * Navigate to dashboard
   */
  const navigateToDashboard = useCallback(
    (options?: { replace?: boolean }) => {
      navigateToPortal('/dashboard/', options);
    },
    [navigateToPortal]
  );

  /**
   * Check if we're currently on a portal page
   */
  const isOnPortalPage = useCallback((): boolean => {
    if (!pathname) return false;

    // Remove locale prefix
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/');

    // Check if it's a portal path (with or without /portal/ prefix)
    const normalizedPath = pathWithoutLocale.replace('/portal/', '/').replace(/\/$/, '') || '/';

    return PORTAL_PATHS.some(
      portalPath => normalizedPath === portalPath || normalizedPath.startsWith(portalPath + '/')
    );
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
