'use client';

import { usePathname } from '@/i18n/navigation';
import { MainLayout } from './MainLayout';
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

  // On portal subdomain, never render MainLayout — all routes are portal routes
  const isSubdomain =
    isPortalSubdomainProp || (typeof window !== 'undefined' ? isPortalSubdomain() : false);
  if (isSubdomain) {
    return <>{children}</>;
  }

  // On main domain, skip MainLayout for /portal/* paths
  if (pathname?.includes('/portal')) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
