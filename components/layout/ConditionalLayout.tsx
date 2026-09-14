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
  const isRecruiterProfileRoute =
    pathname === '/cv' ||
    pathname?.endsWith('/cv') ||
    pathname === '/yotam' ||
    pathname?.endsWith('/yotam');
  const isProposalRoute = pathname?.includes('/proposal/');

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

  // Recruiter-facing profile routes use their own focused shell instead of marketing site chrome.
  if (isRecruiterProfileRoute || isProposalRoute) {
    return <>{children}</>;
  }

  return <MainLayout>{children}</MainLayout>;
}
