'use client';

import { usePathname } from '@/i18n/navigation';
import { MainLayout } from './MainLayout';
import { isPortalPath } from '@/lib/utils/portal-paths';
import { isPortalSubdomain } from '@/lib/utils/subdomain';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (!pathname) {
    return <MainLayout>{children}</MainLayout>;
  }

  // Check if path includes /portal (main domain portal routes)
  const hasPortalPrefix = pathname.includes('/portal');

  // Remove locale prefix to check if it's a portal path
  let pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/') || '/';

  // Remove /portal/ prefix if present (for isPortalPath check)
  if (pathWithoutLocale.startsWith('/portal/')) {
    pathWithoutLocale = pathWithoutLocale.replace('/portal/', '/');
  } else if (pathWithoutLocale === '/portal' || pathWithoutLocale === '/portal/') {
    pathWithoutLocale = '/';
  }

  const isPortalPage = isPortalPath(pathWithoutLocale);

  // Check if we're on portal subdomain
  const isSubdomain = typeof window !== 'undefined' ? isPortalSubdomain() : false;

  // Portal route if:
  // 1. Path includes /portal (main domain), OR
  // 2. We're on portal subdomain AND path matches a portal page
  const isPortalRoute = hasPortalPrefix || (isSubdomain && isPortalPage);

  // Portal routes don't need MainLayout (header/footer)
  if (isPortalRoute) {
    return <>{children}</>;
  }

  // Regular site routes use MainLayout
  return <MainLayout>{children}</MainLayout>;
}

