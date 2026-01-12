'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { usePortalNavigation } from '@/lib/hooks/usePortalNavigation';
import { isLoggingOut } from '@/lib/services/auth';
import { OnboardingWizard } from '@/components/portal/onboarding/OnboardingWizard';

export default function PortalRootClient() {
  const t = useTranslations();
  const { userData, loading, isAuthenticated } = usePortalAuth();
  const { navigateToPortal, navigateToLogin } = usePortalNavigation();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      if (!isLoggingOut()) {
        navigateToLogin();
      }
      return;
    }

    if (userData) {
      if (userData.isAgency) {
        navigateToPortal('/requests/', { replace: true });
        return;
      }

      if (userData.organizations && userData.organizations.length > 0) {
        // Redirect to clean URL - org is stored in context/session
        navigateToPortal('/dashboard/', { replace: true });
        return;
      }

      // User has no organizations - stay on this page to show onboarding
      // Don't redirect to /portal/org/ as that would create a loop
    }
  }, [userData, loading, isAuthenticated, navigateToPortal, navigateToLogin]);

  // Show loading while authenticating
  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse scale-150 -z-10" />
        </div>
        <p className="text-surface-500 font-black font-outfit uppercase tracking-[0.2em] text-[10px]">{t('portal.loading.workspace')}</p>
      </div>
    );
  }

  // Show organization creation form if user has no organizations
  if (userData && !userData.isAgency && (!userData.organizations || userData.organizations.length === 0)) {
    return (
      <OnboardingWizard />
    );
  }

  // Fallback loading state (shouldn't normally reach here)
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex flex-col items-center justify-center space-y-6">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse scale-150 -z-10" />
      </div>
      <p className="text-surface-500 font-black font-outfit uppercase tracking-[0.2em] text-[10px]">{t('portal.loading.workspace')}</p>
    </div>
  );
}

