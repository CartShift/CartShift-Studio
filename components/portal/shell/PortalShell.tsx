'use client';

import { createPortal } from 'react-dom';
import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { getLocaleDirection, getLocaleFontFamily } from '@/lib/locale-config';

// Shell components
import { PortalSidebar } from './PortalSidebar';
import { SidebarBrand } from './SidebarBrand';
import { SidebarNavigation } from './SidebarNavigation';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { SidebarFooter } from './SidebarFooter';
import { PortalState } from './PortalLoadingState';
import { PortalAccessDenied } from './PortalAccessDenied';
import { getAgencyNavGroups, getClientNavGroups } from './constants';
import { usePortalShellState } from './hooks/usePortalShellState';
import { useMobileNavBadges } from './hooks/useMobileNavBadges';
import { PortalShellProps } from './types';

// Existing UI components
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { MobileSearch } from '../ui/MobileSearch';
import { PortalHeader, type HeaderUserData } from '@/components/portal/ui/PortalHeader';
import { NotificationDropdown } from '@/components/portal/ui/NotificationDropdown';
import { MobileBottomNav } from '@/components/portal/shell/MobileBottomNav';
import { CommandPalette } from '@/components/portal/CommandPalette';
import { OnboardingTour } from '../OnboardingTour';
import { ImpersonationBanner } from '../ui/ImpersonationBanner';
import { ModalBackdrop } from '@/components/ui/ModalBackdrop';

export function PortalShell({ children, orgId, isAgency: isAgencyPage = false }: PortalShellProps) {
  const t = useTranslations();
  const locale = useLocale();

  const state = usePortalShellState({
    orgIdProp: orgId,
    isAgencyPage,
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const mobileNavBadges = useMobileNavBadges(state.isAgency);

  // Get nav groups based on user type
  const navGroups = state.isAgency
    ? getAgencyNavGroups((key: string) => t(key as any))
    : getClientNavGroups((key: string) => t(key as any));

  // Calculate if breadcrumbs should be shown
  const showBreadcrumbs = (() => {
    if (!state.pathname) return false;
    const normalizePath = (p: string) => (p.endsWith('/') ? p.slice(0, -1) : p);
    const currentPath = normalizePath(state.pathname);

    const mainPagePaths = new Set(
      navGroups.flatMap(group => group.items.map(item => normalizePath(item.href)))
    );
    mainPagePaths.add('/portal');

    return !mainPagePaths.has(currentPath);
  })();

  // Only show loading state on initial load, not during subsequent navigations
  const showState = !state.initialLoadComplete && (state.loading || state.isAuthorized === null);

  // Access denied state - only if explicitly denied (not null/loading)
  const showAccessDenied =
    !showState && state.isAuthorized === false && !state.hasEverBeenAuthorized;

  return (
    <div
      className={cn(
        'portal-shell min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 antialiased overflow-x-hidden selection:bg-blue-500/20',
        getLocaleFontFamily(locale)
      )}
      dir={getLocaleDirection(locale)}
    >
      {/* TEMP BUILD TEST - DELETE AFTER CONFIRMING */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 99999,
          background: 'lime',
          color: 'black',
          padding: '20px',
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '24px',
        }}
      >
        🚨 BUILD TEST JAN-21-V3 🚨
      </div>
      <OfflineIndicator />

      {/* Skip to main content link for accessibility - enhanced visibility on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-always-on-top focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:font-bold focus:rounded-2xl focus:shadow-xl focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 focus:outline-none focus:text-lg"
      >
        {t('portal.accessibility.skipToContent')}
      </a>

      {showState ? (
        <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
          <PortalState />
        </div>
      ) : showAccessDenied ? (
        <PortalAccessDenied />
      ) : (
        <>
          {/* ARIA Live Region for dynamic content announcements */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            id="portal-announcer"
          >
            {/* Screen reader announcements are injected here dynamically */}
          </div>

          {/* Mobile Sidebar Backdrop */}
          <ModalBackdrop
            isOpen={state.isMobileMenuOpen}
            onClick={() => state.setIsMobileMenuOpen(false)}
            variant="light"
            blur="md"
            zIndex="60"
            preventScroll={false} // Already handled by mobile menu logic
          />

          {/* Sidebar - Persistent element excluded from page transitions */}
          <PortalSidebar
            isExpanded={state.isExpanded}
            isMobileMenuOpen={state.isMobileMenuOpen}
            onClose={() => state.setIsMobileMenuOpen(false)}
            onTouchStart={state.handleTouchStart}
            onTouchEnd={state.handleTouchEnd}
            viewTransitionName="sidebar"
          >
            <SidebarBrand isExpanded={state.isExpanded} />

            <OrganizationSwitcher
              organizations={state.fullOrganizations}
              currentOrgId={state.effectiveOrgId ?? null}
              onSwitch={state.handleOrgSwitch}
              isExpanded={state.isExpanded && state.hasMultipleOrgs}
            />

            <SidebarNavigation
              navGroups={navGroups}
              isExpanded={state.isExpanded}
              isMobile={state.isMobile}
              onItemClick={() => state.setIsMobileMenuOpen(false)}
              userRole={state.memberRole}
            />

            <SidebarFooter
              isExpanded={state.isExpanded}
              isSidebarOpen={state.isSidebarOpen}
              onToggleSidebar={() => state.setIsSidebarOpen(!state.isSidebarOpen)}
              onSignOut={state.handleSignOut}
            />
          </PortalSidebar>

          {/* Main Area */}
          <div
            className={cn(
              'portal-main',
              'transition-all duration-300',
              state.isSidebarOpen
                ? 'md:ps-[var(--sidebar-width-expanded)]'
                : 'md:ps-[var(--sidebar-width-collapsed)]',
              'pb-16 md:pb-0' // Add padding for bottom nav on mobile
            )}
          >
            <ImpersonationBanner />

            <PortalHeader
              onMobileMenuToggle={() => state.setIsMobileMenuOpen(true)}
              onMobileSearchToggle={() => setIsCommandPaletteOpen(true)}
              userData={state.userData as HeaderUserData | null}
              accountType={state.accountType}
              userRole={state.memberRole}
              notifications={state.notifications}
              unreadCount={state.unreadCount}
              isNotificationOpen={state.isNotificationOpen}
              setIsNotificationOpen={state.setIsNotificationOpen}
              notificationRef={state.notificationRef}
              notificationButtonRef={state.notificationButtonRef}
              handleNotificationClick={state.handleNotificationClick}
              handleMarkAllAsRead={state.handleMarkAllAsRead}
              orgId={state.effectiveOrgId}
              onSignOut={state.handleSignOut}
              viewTransitionName="header"
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />

            {/* Page Content Container */}
            <main
              id="main-content"
              className="portal-content"
              data-view-transition-name="page-content"
            >
              {showBreadcrumbs && (
                <div className="mb-4">
                  <Breadcrumbs />
                </div>
              )}
              <div className="portal-reveal">{children}</div>
            </main>

            <MobileBottomNav isAgency={state.isAgency} badges={mobileNavBadges} />
          </div>

          {/* Portal Elements */}
          <CommandPalette isOpen={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
          {state.mounted && typeof document !== 'undefined' && document.body
            ? createPortal(
                <NotificationDropdown
                  isOpen={state.isNotificationOpen}
                  notifications={state.notifications}
                  unreadCount={state.unreadCount}
                  onMarkAllAsRead={state.handleMarkAllAsRead}
                  onNotificationClick={state.handleNotificationClick}
                  position={state.notificationPosition}
                  dropdownRef={state.notificationDropdownRef}
                />,
                document.body
              )
            : null}

          {/* Onboarding Tour for new users */}
          {state.showOnboarding && state.userData?.id && (
            <OnboardingTour
              userId={state.userData.id}
              onComplete={() => state.setShowOnboarding(false)}
              onSkip={() => state.setShowOnboarding(false)}
            />
          )}

          {/* Mobile Search */}
          <MobileSearch
            isOpen={state.isMobileSearchOpen}
            onClose={() => state.setIsMobileSearchOpen(false)}
          />
        </>
      )}
    </div>
  );
}
