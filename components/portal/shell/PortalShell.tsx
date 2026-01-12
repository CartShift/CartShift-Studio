'use client';

import { createPortal } from 'react-dom';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { getLocaleDirection, getLocaleFontFamily } from '@/lib/locale-config';

// Shell components
import { PortalSidebar } from './PortalSidebar';
import { SidebarBrand } from './SidebarBrand';
import { SidebarNavigation } from './SidebarNavigation';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { SidebarFooter } from './SidebarFooter';
import { PortalLoadingState } from './PortalLoadingState';
import { PortalAccessDenied } from './PortalAccessDenied';
import { getAgencyNavGroups, getClientNavGroups } from './constants';
import { usePortalShellState } from './hooks/usePortalShellState';
import { PortalShellProps } from './types';

// Existing UI components
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { Breadcrumbs } from '../ui/Breadcrumbs';
import { MobileSearch } from '../ui/MobileSearch';
import { PortalHeader } from '../ui/PortalHeader';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { OnboardingTour } from '../OnboardingTour';

export function PortalShell({ children, orgId, isAgency: isAgencyPage = false }: PortalShellProps) {
  const t = useTranslations();
  const locale = useLocale();

  const state = usePortalShellState({
    orgIdProp: orgId,
    isAgencyPage,
  });

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

  // Loading state
  if (state.loading || state.isAuthorized === null) {
    return <PortalLoadingState />;
  }

  // Access denied state
  if (state.isAuthorized === false) {
    return <PortalAccessDenied />;
  }

  return (
    <div
      className={cn(
        'portal-shell min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 antialiased overflow-x-hidden selection:bg-blue-500/20',
        getLocaleFontFamily(locale)
      )}
      dir={getLocaleDirection(locale)}
    >
      <OfflineIndicator />

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-blue-600 focus:text-white focus:rounded-2xl focus:shadow-xl focus:outline-none"
      >
        {t('portal.accessibility.skipToContent')}
      </a>

      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {state.isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surface-950/40 backdrop-blur-md z-[60] md:hidden"
            onClick={() => state.setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <PortalSidebar
        isExpanded={state.isExpanded}
        isMobileMenuOpen={state.isMobileMenuOpen}
        onClose={() => state.setIsMobileMenuOpen(false)}
        onTouchStart={state.handleTouchStart}
        onTouchEnd={state.handleTouchEnd}
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
            : 'md:ps-[var(--sidebar-width-collapsed)]'
        )}
      >
        <PortalHeader
          onMobileMenuToggle={() => state.setIsMobileMenuOpen(true)}
          onMobileSearchToggle={() => state.setIsMobileSearchOpen(true)}
          userData={state.userData as any}
          accountType={state.accountType}
          notifications={state.notifications}
          unreadCount={state.unreadCount}
          isNotificationOpen={state.isNotificationOpen}
          setIsNotificationOpen={state.setIsNotificationOpen}
          notificationRef={state.notificationRef}
          notificationButtonRef={state.notificationButtonRef}
          handleNotificationClick={state.handleNotificationClick}
          handleMarkAllAsRead={state.handleMarkAllAsRead}
          orgId={state.effectiveOrgId}
        />

        {/* Page Content Container */}
        <main id="main-content" className="portal-content">
          {showBreadcrumbs && (
            <div className="mb-4">
              <Breadcrumbs />
            </div>
          )}
          <div className="portal-reveal">{children}</div>
        </main>
      </div>

      {/* Portal Elements */}
      {state.mounted &&
        createPortal(
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
        )}

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
    </div>
  );
}
