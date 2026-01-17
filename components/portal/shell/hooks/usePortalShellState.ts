'use client';

import { useCallback } from 'react';
import { usePortalAuthState } from './usePortalAuthState';
import { usePortalUIState } from './usePortalUIState';
import { usePortalNotifications } from './usePortalNotifications';
import { useNotificationPositioning } from './useNotificationPositioning';

interface UsePortalShellStateOptions {
  orgIdProp?: string;
  isAgencyPage?: boolean;
}

/**
 * Main hook for portal shell state management.
 * Composes focused hooks for auth, UI, and notifications.
 */
export function usePortalShellState({
  orgIdProp,
  isAgencyPage = false,
}: UsePortalShellStateOptions) {
  // 1. Auth and authorization state
  const authState = usePortalAuthState({ orgIdProp, isAgencyPage });

  // 2. UI state (sidebar, mobile, onboarding)
  const uiState = usePortalUIState({
    onboardingComplete: authState.userData?.onboardingComplete,
    isAgency: authState.isAgency,
  });

  // 3. Notifications
  const notificationState = usePortalNotifications({
    userId: authState.userData?.id ?? null,
    isAuthenticated: !!authState.userData,
    loading: authState.loading,
  });

  // 4. Notification positioning
  const { position: notificationPosition } = useNotificationPositioning({
    buttonRef: notificationState.notificationButtonRef,
    dropdownRef: notificationState.notificationDropdownRef,
    isOpen: notificationState.isNotificationOpen,
  });

  // 5. Wrap handleOrgSwitch to include switchOrg from authState
  const handleOrgSwitch = useCallback(
    (orgId: string) => {
      uiState.handleOrgSwitch(orgId, authState.switchOrg);
    },
    [uiState, authState.switchOrg]
  );

  // 6. Return combined state (maintaining backward compatibility)
  return {
    // UI State
    isSidebarOpen: uiState.isSidebarOpen,
    setIsSidebarOpen: uiState.setIsSidebarOpen,
    isMobileMenuOpen: uiState.isMobileMenuOpen,
    setIsMobileMenuOpen: uiState.setIsMobileMenuOpen,
    isNotificationOpen: notificationState.isNotificationOpen,
    setIsNotificationOpen: notificationState.setIsNotificationOpen,
    isMobile: uiState.isMobile,
    isMobileSearchOpen: uiState.isMobileSearchOpen,
    setIsMobileSearchOpen: uiState.setIsMobileSearchOpen,
    mounted: uiState.mounted,
    showOnboarding: uiState.showOnboarding,
    setShowOnboarding: uiState.setShowOnboarding,
    notifications: notificationState.notifications,
    unreadCount: notificationState.unreadCount,
    notificationPosition,
    isAuthorized: authState.isAuthorized,
    isExpanded: uiState.isExpanded,
    isAgency: authState.isAgency,
    initialLoadComplete: authState.initialLoadComplete,
    hasEverBeenAuthorized: authState.hasEverBeenAuthorized,

    // Refs
    notificationRef: notificationState.notificationRef,
    notificationButtonRef: notificationState.notificationButtonRef,
    notificationDropdownRef: notificationState.notificationDropdownRef,

    // Auth/Org
    userData: authState.displayUserData,
    loading: authState.loading,
    accountType: authState.accountType,
    effectiveOrgId: authState.effectiveOrgId,
    hasMultipleOrgs: authState.hasMultipleOrgs,
    fullOrganizations: authState.fullOrganizations,

    // Route
    pathname: uiState.pathname,
    locale: uiState.locale,

    // Handlers
    handleTouchStart: uiState.handleTouchStart,
    handleTouchEnd: uiState.handleTouchEnd,
    handleNotificationClick: notificationState.handleNotificationClick,
    handleMarkAllAsRead: notificationState.handleMarkAllAsRead,
    handleSignOut: uiState.handleSignOut,
    handleOrgSwitch,
    memberRole: authState.memberRole,
  };
}
