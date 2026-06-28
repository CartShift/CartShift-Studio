'use client';

import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { getLocaleDirection, getLocaleFontFamily } from '@/lib/locale-config';
import { canAccessNav } from '@/lib/utils/permissions';

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
import { announcePortal } from './portal-announcer';
import { useMobileMenuFocusTrap } from './useMobileMenuFocusTrap';
import { PortalShellProps } from './types';
import { shouldShowPortalBreadcrumbs } from '@/lib/utils/portal-nav';

// Existing UI components
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { PortalHeader, type HeaderUserData } from '@/components/portal/ui/PortalHeader';
import { MobileBottomNav } from '@/components/portal/shell/MobileBottomNav';
import { ImpersonationBanner } from '../ui/ImpersonationBanner';

const CommandPalette = dynamic(
  () => import('@/components/portal/CommandPalette').then(module => module.CommandPalette),
  { ssr: false }
);
const MobileSearch = dynamic(
  () => import('../ui/MobileSearch').then(module => module.MobileSearch),
  { ssr: false }
);
const NotificationDropdown = dynamic(
  () =>
    import('@/components/portal/ui/NotificationDropdown').then(
      module => module.NotificationDropdown
    ),
  { ssr: false }
);
const OnboardingTour = dynamic(
  () => import('../OnboardingTour').then(module => module.OnboardingTour),
  { ssr: false }
);
const RequestPreviewModal = dynamic(
  () =>
    import('@/components/portal/requests/RequestPreviewModal').then(
      module => module.RequestPreviewModal
    ),
  { ssr: false }
);

export function PortalShell({ children, orgId, isAgency: isAgencyPage = false }: PortalShellProps) {
  const t = useTranslations('portal');
  const tA11y = useTranslations('portal.accessibility');
  const locale = useLocale();
  const sidebarRef = useRef<HTMLElement>(null);

  const state = usePortalShellState({
    orgIdProp: orgId,
    isAgencyPage,
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const mobileNavBadges = useMobileNavBadges(state.isAgency, state.isMobile);

  useEffect(() => {
    const handleCommandPaletteShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsCommandPaletteOpen(open => !open);
      }
    };

    window.addEventListener('keydown', handleCommandPaletteShortcut);
    return () => window.removeEventListener('keydown', handleCommandPaletteShortcut);
  }, []);

  // Get nav groups based on user type
  const navGroups = state.isAgency
    ? getAgencyNavGroups(key => t(key as any))
    : getClientNavGroups(key => t(key as any));

  const filteredNavGroups = useMemo(
    () =>
      navGroups
        .map(group => ({
          ...group,
          items: group.items.filter(item => canAccessNav(state.memberRole, item.roles)),
        }))
        .filter(group => group.items.length > 0),
    [navGroups, state.memberRole]
  );

  const closeMobileMenu = () => state.setIsMobileMenuOpen(false);

  useMobileMenuFocusTrap(state.isMobileMenuOpen, closeMobileMenu, sidebarRef);

  const mainPagePaths = filteredNavGroups.flatMap(group => group.items.map(item => item.href));
  const showBreadcrumbs = shouldShowPortalBreadcrumbs(state.pathname, mainPagePaths);

  const handleOrgSwitch = (orgId: string) => {
    const org = state.fullOrganizations.find(o => o.id === orgId);
    state.handleOrgSwitch(orgId);
    if (org) {
      announcePortal(t('accessibility.orgSwitched', { name: org.name }));
    }
  };

  const handleMarkAllAsRead = async () => {
    await state.handleMarkAllAsRead();
    announcePortal(t('accessibility.allNotificationsRead'));
  };

  // Only show loading state on initial load, not during subsequent navigations
  const showState = !state.initialLoadComplete && (state.loading || state.isAuthorized === null);

  // Access denied state - only if explicitly denied (not null/loading)
  const showAccessDenied = !showState && state.isAuthorized === false;

  return (
    <div
      className={cn(
        'portal-shell min-h-screen text-surface-900 dark:text-surface-50 antialiased overflow-x-hidden selection:bg-primary-500/20',
        getLocaleFontFamily(locale)
      )}
      dir={getLocaleDirection(locale)}
    >
      {/* Skip to main content link for accessibility - enhanced visibility on focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-always-on-top focus:px-6 focus:py-3 focus:bg-primary-600 focus:text-white focus:font-bold focus:rounded-2xl focus:shadow-xl focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 focus:outline-none focus:text-lg"
      >
        {t('accessibility.skipToContent')}
      </a>

      {showState ? (
        <PortalState />
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

          {/* Sidebar - Persistent element excluded from page transitions */}
          <PortalSidebar
            isExpanded={state.isExpanded}
            isMobileMenuOpen={state.isMobileMenuOpen}
            onMobileMenuOpenChange={state.setIsMobileMenuOpen}
            onTouchStart={state.handleTouchStart}
            onTouchEnd={state.handleTouchEnd}
            viewTransitionName="sidebar"
            sidebarRef={sidebarRef}
            mobileMenuLabel={tA11y('mainNavigation')}
          >
            <SidebarBrand
              isExpanded={state.isExpanded}
              isAgency={state.isAgency}
              isSidebarOpen={state.isSidebarOpen}
              onToggleSidebar={() => state.setIsSidebarOpen(!state.isSidebarOpen)}
            />

            <OrganizationSwitcher
              organizations={state.fullOrganizations}
              currentOrgId={state.effectiveOrgId ?? null}
              onSwitch={handleOrgSwitch}
              isExpanded={state.isExpanded && state.hasMultipleOrgs}
            />

            <SidebarNavigation
              navGroups={filteredNavGroups}
              isExpanded={state.isExpanded}
              isMobile={state.isMobile}
              onItemClick={() => state.setIsMobileMenuOpen(false)}
              userRole={state.memberRole}
            />

            <SidebarFooter />
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
              onMobileMenuToggle={() => {
                state.setIsMobileMenuOpen(true);
                announcePortal(t('accessibility.openMenu'));
              }}
              isMobileMenuOpen={state.isMobileMenuOpen}
              onMobileSearchToggle={() => state.setIsMobileSearchOpen(true)}
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
              handleMarkAllAsRead={handleMarkAllAsRead}
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

            <MobileBottomNav
              isAgency={state.isAgency}
              navGroups={filteredNavGroups}
              badges={mobileNavBadges}
            />
          </div>

          {/* Portal Elements */}
          {isCommandPaletteOpen && (
            <CommandPalette isOpen={isCommandPaletteOpen} onOpenChange={setIsCommandPaletteOpen} />
          )}
          {state.mounted &&
          state.isNotificationOpen &&
          typeof document !== 'undefined' &&
          document.body
            ? createPortal(
                <NotificationDropdown
                  isOpen={state.isNotificationOpen}
                  notifications={state.notifications}
                  unreadCount={state.unreadCount}
                  onMarkAllAsRead={handleMarkAllAsRead}
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
          {state.isMobileSearchOpen && (
            <MobileSearch
              isOpen={state.isMobileSearchOpen}
              onClose={() => {
                state.setIsMobileSearchOpen(false);
                announcePortal(t('accessibility.searchClosed'));
              }}
            />
          )}

          <RequestPreviewModal />
        </>
      )}
    </div>
  );
}
