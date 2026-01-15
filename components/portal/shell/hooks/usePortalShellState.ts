'use client';

import { useState, useEffect, useRef, useCallback, startTransition, useMemo } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useOrg } from '@/lib/context/OrgContext';
import { logout, isLoggingOut } from '@/lib/services/auth';
import { getMemberByUserId, ensureMembership } from '@/lib/services/portal-organizations';
import {
  subscribeToNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/services/portal-notifications';
import { Notification } from '@/lib/types/portal';
import { isRTLLocale } from '@/lib/locale-config';
import { NotificationPosition } from '../types';
import { getPortalPath } from '@/lib/utils/portal-paths';

interface UsePortalShellStateOptions {
  orgIdProp?: string;
  isAgencyPage?: boolean;
}

export function usePortalShellState({
  orgIdProp,
  isAgencyPage = false,
}: UsePortalShellStateOptions) {
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPosition, setNotificationPosition] = useState<NotificationPosition>({
    top: 0,
    right: 0,
    left: 0,
  });

  // Access State
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [memberRole, setMemberRole] = useState<import('@/lib/types/portal').UserRole | undefined>(
    undefined
  );

  // Refs
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const hasEverBeenAuthorizedRef = useRef(false);

  // Hooks
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const {
    userData,
    loading,
    isAuthenticated,
    accountType,
    isImpersonating,
    impersonatedAccountId,
  } = usePortalAuth();
  const { orgId: contextOrgId, hasMultipleOrgs, fullOrganizations, switchOrg } = useOrg();

  // Derived Values
  const userId = userData?.id ?? null;
  const effectiveOrgId = contextOrgId ?? orgIdProp;
  const isExpanded = isMobileMenuOpen || isSidebarOpen;
  const isAgency = isAgencyPage || userData?.isAgency;

  // Calculate Display User Data for Impersonation
  const displayUserData = useMemo(() => {
    if (isImpersonating && impersonatedAccountId && userData) {
      const org = fullOrganizations.find(o => o.id === impersonatedAccountId);
      if (org) {
        return {
          ...userData,
          name: org.name,
          photoUrl: org.branding?.iconUrl || org.logoUrl || userData.photoUrl,
        };
      }
    }
    return userData;
  }, [userData, isImpersonating, impersonatedAccountId, fullOrganizations]);

  // Access check effect
  useEffect(() => {
    let internalMounted = true;

    if (!loading) {
      // Mark initial load as complete once auth is no longer loading
      if (!initialLoadComplete) {
        setInitialLoadComplete(true);
      }

      if (!isAuthenticated) {
        if (!isLoggingOut()) {
          router.push(getPortalPath('/login/'));
        }
        return;
      }

      const checkAccess = async () => {
        try {
          // Handle Impersonation - Grant Owner permissions visually
          if (isImpersonating && impersonatedAccountId) {
            if (internalMounted) {
              setIsAuthorized(true);
              setMemberRole(undefined); // Remove specific role so Badge (Client/Agency) is shown
              hasEverBeenAuthorizedRef.current = true;
            }
            return;
          }

          if (effectiveOrgId && userData) {
            if (userData.isAgency || userData.accountType === 'AGENCY') {
              if (internalMounted) {
                setIsAuthorized(true);
                // Agency users viewing ANY org act with their agency role or as Admin/Owner
                // If they are explicitly a member, use that role, otherwise use Agency Role?
                // For simplified permissions, agency admins viewing clients have OWNER/ADMIN equivalent access.
                // But let's verify if they have a specific member record first.
                // Actually, logic below checks member for typical users.

                // For now, if account is agency, we assume authorized for the org (if allowed by rules)
                // And set role from USER data if available, or OWNER default.
                setMemberRole(userData.agencyRole || 'owner');
                hasEverBeenAuthorizedRef.current = true;
              }
              return;
            }

            if (effectiveOrgId === 'template') {
              console.warn('[PortalShell] effectiveOrgId is "template". Skipping access check.');
              if (internalMounted) {
                setIsAuthorized(true);
                setMemberRole('owner'); // Template is usually owner context
                hasEverBeenAuthorizedRef.current = true;
              }
              return;
            }

            let member = await getMemberByUserId(effectiveOrgId, userData.id);

            if (!member) {
              member = await ensureMembership(
                effectiveOrgId,
                userData.id,
                userData.email,
                userData.name
              );
            }

            if (internalMounted) {
              const authorized = member !== null;
              setIsAuthorized(authorized);
              if (member) setMemberRole(member.role);
              if (authorized) hasEverBeenAuthorizedRef.current = true;
            }
          } else if (isAgencyPage && userData) {
            const authorized = Boolean(userData.isAgency) || userData.accountType === 'AGENCY';
            if (internalMounted) {
              setIsAuthorized(authorized);
              if (authorized) {
                setMemberRole(userData.agencyRole || 'owner');
                hasEverBeenAuthorizedRef.current = true;
              }
            }
          } else {
            if (internalMounted) {
              setIsAuthorized(true);
              // Default role if no org context? Maybe none.
              hasEverBeenAuthorizedRef.current = true;
            }
          }
        } catch (error) {
          console.error('[PortalShell] Error checking access:', error);
          if (internalMounted) setIsAuthorized(false);
        }
      };

      checkAccess();
    }

    if (userData && !userData.isAgency && !userData.onboardingComplete && internalMounted) {
      setShowOnboarding(true);
    }

    return () => {
      internalMounted = false;
    };
  }, [
    loading,
    isAuthenticated,
    userData,
    effectiveOrgId,
    isAgencyPage,
    router,
    isImpersonating,
    impersonatedAccountId,
  ]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
    document.documentElement.style.setProperty('--sidebar-width-expanded', '280px');
    document.documentElement.style.setProperty('--sidebar-width-collapsed', '80px');
  }, []);

  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => {
      // Use startTransition to ensure state updates happen after mount
      startTransition(() => {
        setIsMobile(window.innerWidth < 768);
      });
    };
    // Defer initial check to ensure component is mounted
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

  // Notification subscription effect
  useEffect(() => {
    if (!userId || !isAuthenticated || loading) return;

    let internalMounted = true;

    const unsubscribeNotifications = subscribeToNotifications(
      userId,
      data => {
        if (internalMounted) {
          setNotifications(data);
        }
      },
      { limit: 10 }
    );

    const unsubscribeUnreadCount = subscribeToUnreadCount(userId, count => {
      if (internalMounted) {
        setUnreadCount(count);
      }
    });

    return () => {
      internalMounted = false;
      unsubscribeNotifications();
      unsubscribeUnreadCount();
    };
  }, [userId, isAuthenticated, loading]);

  // Notification position effect
  useEffect(() => {
    const updatePosition = () => {
      if (notificationButtonRef.current && notificationDropdownRef.current) {
        const buttonRect = notificationButtonRef.current.getBoundingClientRect();
        const dropdownWidth = 384;
        const dropdownHeight = 450;
        const gap = 8;
        const padding = 16;
        const isRTL = document.documentElement.dir === 'rtl';
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const maxDropdownWidth = Math.min(dropdownWidth, viewportWidth - padding * 2);

        let top = buttonRect.bottom + gap;
        let right: number | undefined;
        let left: number | undefined;

        if (isRTL) {
          const spaceOnRight = viewportWidth - buttonRect.right;
          const spaceOnLeft = buttonRect.left;

          if (spaceOnRight >= maxDropdownWidth + padding) {
            right = viewportWidth - buttonRect.right;
            left = undefined;
          } else if (spaceOnLeft >= maxDropdownWidth + padding) {
            left = Math.max(padding, buttonRect.left - maxDropdownWidth);
            right = undefined;
          } else {
            right = padding;
            left = undefined;
          }

          if (right !== undefined) {
            const calculatedRight = right;
            const actualWidth = Math.min(
              maxDropdownWidth,
              viewportWidth - calculatedRight - padding
            );
            if (calculatedRight + actualWidth > viewportWidth - padding) {
              right = padding;
            }
          }
          if (left !== undefined && left < padding) {
            left = padding;
          }
        } else {
          const spaceOnRight = viewportWidth - buttonRect.right;
          const spaceOnLeft = buttonRect.left;

          if (spaceOnRight >= maxDropdownWidth + padding) {
            right = viewportWidth - buttonRect.right;
            left = undefined;
          } else if (spaceOnLeft >= maxDropdownWidth + padding) {
            left = Math.max(padding, buttonRect.left - maxDropdownWidth);
            right = undefined;
          } else {
            right = padding;
            left = undefined;
          }

          if (right !== undefined) {
            const calculatedRight = right;
            const actualWidth = Math.min(
              maxDropdownWidth,
              viewportWidth - calculatedRight - padding
            );
            if (calculatedRight + actualWidth > viewportWidth - padding) {
              right = padding;
            }
          }
          if (left !== undefined) {
            const actualWidth = Math.min(maxDropdownWidth, viewportWidth - left - padding);
            if (left + actualWidth > viewportWidth - padding) {
              left = viewportWidth - actualWidth - padding;
            }
            if (left < padding) {
              left = padding;
            }
          }
        }

        if (top + dropdownHeight > viewportHeight - padding) {
          top = Math.max(padding, buttonRect.top - dropdownHeight - gap);
        }
        if (top < padding) {
          top = padding;
        }

        setNotificationPosition({ top, right, left });
      }
    };

    if (isNotificationOpen) {
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      const rafId = requestAnimationFrame(updatePosition);
      return () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
    return undefined;
  }, [isNotificationOpen]);

  // Click outside effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target as Node) &&
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isNotificationOpen]);

  // Touch handlers
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

  // Action handlers
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
      if (notification.link) {
        router.push(notification.link);
        setIsNotificationOpen(false);
      }
    },
    [router]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (!userData?.id) return;
    await markAllNotificationsAsRead(userData.id);
  }, [userData?.id]);

  const handleSignOut = useCallback(async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [router]);

  const handleOrgSwitch = useCallback(
    (orgId: string) => {
      switchOrg(orgId);
      router.push(getPortalPath('/dashboard/'));
    },
    [switchOrg, router]
  );

  return {
    // State
    isSidebarOpen,
    setIsSidebarOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isNotificationOpen,
    setIsNotificationOpen,
    isMobile,
    isMobileSearchOpen,
    setIsMobileSearchOpen,
    mounted,
    showOnboarding,
    setShowOnboarding,
    notifications,
    unreadCount,
    notificationPosition,
    isAuthorized,
    isExpanded,
    isAgency,
    initialLoadComplete,
    hasEverBeenAuthorized: hasEverBeenAuthorizedRef.current,

    // Refs
    notificationRef,
    notificationButtonRef,
    notificationDropdownRef,

    // Auth/Org
    userData: displayUserData,
    loading,
    accountType,
    effectiveOrgId,
    hasMultipleOrgs,
    fullOrganizations,

    // Route
    pathname,
    locale,

    // Handlers
    handleTouchStart,
    handleTouchEnd,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleSignOut,
    handleOrgSwitch,
    memberRole,
  };
}
