'use client';

import { useEffect, useRef } from 'react';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { usePortalNavigation } from '@/lib/hooks/usePortalNavigation';
import { isLoggingOut } from '@/lib/services/auth';
import { OnboardingWizard } from '@/components/portal/onboarding/OnboardingWizard';
import { PortalLoadingState } from '@/components/portal/shell/PortalLoadingState';

export default function PortalRootClient() {
  const { userData, loading, isAuthenticated } = usePortalAuth();
  const { navigateToPortal, navigateToLogin } = usePortalNavigation();

  // Track redirect to prevent multiple redirects in same cycle
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Reset redirect flag on unmount
    return () => {
      hasRedirectedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    // Prevent multiple redirects in same render cycle
    if (hasRedirectedRef.current) {
      hasRedirectedRef.current = false;
      return;
    }

    if (!isAuthenticated) {
      if (!isLoggingOut()) {
        hasRedirectedRef.current = true;
        navigateToLogin();
      }
      return;
    }

    if (userData) {
      if (userData.isAgency) {
        hasRedirectedRef.current = true;
        navigateToPortal('/requests/', { replace: true });
        return;
      }

      if (userData.organizations && userData.organizations.length > 0) {
        // Redirect to clean URL - org is stored in context/session
        hasRedirectedRef.current = true;
        navigateToPortal('/dashboard/', { replace: true });
        return;
      }

      // User has no organizations - stay on this page to show onboarding
      // Don't redirect to /portal/org/ as that would create a loop
    }
  }, [userData, loading, isAuthenticated, navigateToPortal, navigateToLogin]);

  // Show loading while authenticating
  if (loading || !userData) {
    return <PortalLoadingState />;
  }

  // Show organization creation form if user has no organizations
  if (
    userData &&
    !userData.isAgency &&
    (!userData.organizations || userData.organizations.length === 0)
  ) {
    return <OnboardingWizard />;
  }

  // Fallback loading state (shouldn't normally reach here)
  return <PortalLoadingState />;
}
