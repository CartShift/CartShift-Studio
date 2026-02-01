'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  subscribeToNotifications,
  subscribeToUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/services/portal-notifications';
import { getPortalPath } from '@/lib/utils/portal-paths';
import type { Notification } from '@/lib/types/portal';

interface UsePortalNotificationsOptions {
  userId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  limit?: number;
}

interface UsePortalNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  isNotificationOpen: boolean;
  setIsNotificationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleNotificationClick: (notification: Notification) => void;
  handleMarkAllAsRead: () => Promise<void>;
  notificationRef: React.RefObject<HTMLDivElement | null>;
  notificationButtonRef: React.RefObject<HTMLButtonElement | null>;
  notificationDropdownRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for managing portal notifications.
 * Handles subscription, unread count, and notification actions.
 */
export function usePortalNotifications({
  userId,
  isAuthenticated,
  loading,
  limit = 10,
}: UsePortalNotificationsOptions): UsePortalNotificationsResult {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Refs for click-outside detection
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

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
      { limit }
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
  }, [userId, isAuthenticated, loading, limit]);

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

  // Notification click handler
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
      if (notification.link) {
        // Normalize the link using getPortalPath to handle both /portal/ prefix
        // in development and relative paths on portal subdomain
        const normalizedLink = getPortalPath(notification.link);
        router.push(normalizedLink);
        setIsNotificationOpen(false);
      }
    },
    [router]
  );

  // Mark all as read handler
  const handleMarkAllAsRead = useCallback(async () => {
    if (!userId) return;
    await markAllNotificationsAsRead(userId);
  }, [userId]);

  return {
    notifications,
    unreadCount,
    isNotificationOpen,
    setIsNotificationOpen,
    handleNotificationClick,
    handleMarkAllAsRead,
    notificationRef,
    notificationButtonRef,
    notificationDropdownRef,
  };
}
