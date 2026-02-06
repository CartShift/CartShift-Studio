'use client';

import { usePathname } from '@/i18n/navigation';
import { MainLayout } from './MainLayout';
import { isPortalPath } from '@/lib/utils/portal-paths';
import { isPortalSubdomain } from '@/lib/utils/subdomain';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  isPortalSubdomain?: boolean;
}

export function ConditionalLayout({
  children,
  isPortalSubdomain: isPortalSubdomainProp,
}: ConditionalLayoutProps) {
  const pathname = usePathname();

  if (!pathname) {
    return <MainLayout>{children}</MainLayout>;
  }

  const hasPortalPrefix = pathname.includes('/portal');

  let pathWithoutLocale = pathname.replace(/^\/[a-z]{2}\//, '/') || '/';
  if (pathWithoutLocale.startsWith('/portal/')) {
    pathWithoutLocale = pathWithoutLocale.replace('/portal/', '/');
  } else if (pathWithoutLocale === '/portal' || pathWithoutLocale === '/portal/') {
    pathWithoutLocale = '/';
  }

  const isPortalPage = isPortalPath(pathWithoutLocale);

  // Use server-provided prop for SSR, client detection for hydration
  const isSubdomain =
    isPortalSubdomainProp || (typeof window !== 'undefined' ? isPortalSubdomain() : false);

  const isPortalRoute = hasPortalPrefix || (isSubdomain && isPortalPage);

  if (isPortalRoute) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
