'use client';

import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { toast } from 'sonner';
import { logout } from '@/lib/services/auth';
import { isRTLLocale } from '@/lib/locale-config';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Logger } from '@/lib/logger';

interface UsePortalUIStateOptions {
  onboardingComplete?: boolean;
  isAgency?: boolean;
}

interface UsePortalUIStateResult {
  // Sidebar state
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isExpanded: boolean;

  // Mobile state
  isMobile: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileSearchOpen: boolean;
  setIsMobileSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Onboarding
  showOnboarding: boolean;
  setShowOnboarding: React.Dispatch<React.SetStateAction<boolean>>;

  // Lifecycle
  mounted: boolean;

  // Touch handlers for mobile swipe
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;

  // Actions
  handleSignOut: () => Promise<void>;
  handleOrgSwitch: (orgId: string, switchOrg: (orgId: string) => void) => void;

  // Route info
  pathname: string;
  locale: string;
}

/**
 * Hook for managing portal UI state.
 * Handles sidebar, mobile menu, onboarding, and touch interactions.
 */
export function usePortalUIState({
  onboardingComplete = true,
  isAgency = false,
}: UsePortalUIStateOptions = {}): UsePortalUIStateResult {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('portal.sidebar');

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Lifecycle
  const [mounted, setMounted] = useState(false);

  // Touch tracking
  const touchStartX = useRef<number | null>(null);

  // Derived values
  const isExpanded = isMobileMenuOpen || isSidebarOpen;

  // Mount effect
  useEffect(() => {
    setMounted(true);

    // Enable body transitions after a short delay
    requestAnimationFrame(() => {
      document.documentElement.classList.add('transitions-enabled');
    });
  }, []);

  // Check if onboarding should be shown
  useEffect(() => {
    if (!isAgency && !onboardingComplete) {
      setShowOnboarding(true);
    }
  }, [isAgency, onboardingComplete]);

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      startTransition(() => {
        setIsMobile(window.innerWidth < 768);
      });
    };
    requestAnimationFrame(checkMobile);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Body overflow effect
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Touch handlers for swipe-to-close
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobileMenuOpen || touchStartX.current === null) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX.current;
      const isRTL = isRTLLocale(locale);
      const swipeThreshold = 50;

      const shouldClose = isRTL ? diff > swipeThreshold : diff < -swipeThreshold;
      if (shouldClose) {
        setIsMobileMenuOpen(false);
      }
      touchStartX.current = null;
    },
    [isMobileMenuOpen, locale]
  );

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      router.push(getPortalPath('/login/'));
    } catch (error) {
      Logger.error('Logout failed', error);
      toast.error(t('signOutFailed'), {
        description: error instanceof Error ? error.message : t('signOutFailedDesc'),
      });
    }
  }, [router, t]);

  // Organization switch handler
  const handleOrgSwitch = useCallback(
    (orgId: string, switchOrg: (orgId: string) => void) => {
      switchOrg(orgId);
      router.push(getPortalPath('/dashboard/'));
    },
    [router]
  );

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isExpanded,
    isMobile,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isMobileSearchOpen,
    setIsMobileSearchOpen,
    showOnboarding,
    setShowOnboarding,
    mounted,
    handleTouchStart,
    handleTouchEnd,
    handleSignOut,
    handleOrgSwitch,
    pathname,
    locale,
  };
}
