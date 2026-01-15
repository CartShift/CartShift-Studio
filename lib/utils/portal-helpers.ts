'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/lib/locale-config';
import { Timestamp } from 'firebase/firestore';
import {
  STATUS_CONFIG,
  CLIENT_STATUS_CONFIG,
  CLIENT_STATUS_MAP,
  RequestStatus,
  PortalUser,
} from '@/lib/types/portal';

import { BadgeVariant } from '@/components/ui/Badge';

// ============================================
// STATUS COLOR MAPPING
// ============================================

/**
 * Maps internal color names to Badge variant colors.
 * Handles colors from both:
 * - STATUS_CONFIG (request status colors)
 * - PRICING_STATUS_CONFIG (pricing status colors)
 */
export function mapStatusColor(color: string): BadgeVariant {
  // Direct mappings for supported variants
  if (['blue', 'green', 'yellow', 'red', 'purple', 'gray', 'emerald', 'orange'].includes(color)) {
    return color as BadgeVariant;
  }

  // Backwards compatibility or fallbacks
  return 'gray';
}

/**
 * Get the badge variant for a request status (agency view).
 */
export function getStatusBadgeVariant(status: RequestStatus): BadgeVariant {
  return mapStatusColor(STATUS_CONFIG[status]?.color || 'gray');
}

/**
 * Get the badge variant for a request status (client view - simplified).
 */
export function getClientStatusBadgeVariant(status: RequestStatus): BadgeVariant {
  const clientStatus = CLIENT_STATUS_MAP[status];
  return mapStatusColor(CLIENT_STATUS_CONFIG[clientStatus]?.color || 'gray');
}

/**
 * Get the badge variant for a pricing request status.
 * Use with PRICING_STATUS_CONFIG from lib/types/pricing.
 */
export function getPricingStatusBadgeVariant(color: string): BadgeVariant {
  return mapStatusColor(color || 'gray');
}

// ============================================
// DATE FORMATTING
// ============================================

/**
 * Formats a Firestore Timestamp or Date for display in the portal.
 * Handles the common pattern of formatting dates with locale support.
 *
 * @param timestamp - Firestore Timestamp, Date object, or undefined
 * @param formatStr - date-fns format string (default: 'MMM d, yyyy')
 * @param locale - Locale code (e.g., 'en', 'he')
 * @param fallback - Fallback string if timestamp is undefined
 *
 * @example
 * ```tsx
 * {formatPortalDate(request.createdAt, 'MMMM d, yyyy', locale)}
 * ```
 */
export function formatPortalDate(
  timestamp: Timestamp | Date | undefined | null,
  formatStr: string = 'MMM d, yyyy',
  locale: string = 'en',
  fallback: string = ''
): string {
  if (!timestamp) return fallback;

  try {
    const date =
      timestamp instanceof Date
        ? timestamp
        : 'toDate' in timestamp
          ? timestamp.toDate()
          : new Date(timestamp as any);

    return format(date, formatStr, { locale: getDateLocale(locale) });
  } catch {
    return fallback;
  }
}

/**
 * Formats a relative time (e.g., "2 hours ago", "3 days ago") using date-fns.
 */
export function formatRelativeTime(
  timestamp: Timestamp | Date | undefined | null,
  locale: string = 'en'
): string {
  if (!timestamp) return '';

  const date =
    timestamp instanceof Date
      ? timestamp
      : 'toDate' in timestamp
        ? timestamp.toDate()
        : new Date(timestamp as any);

  return formatDistanceToNow(date, {
    addSuffix: true,
    locale: getDateLocale(locale),
  });
}

// ============================================
// USER DISPLAY HELPERS
// ============================================

/**
 * Gets the display name for a user, falling back to email.
 */
export function getUserDisplayName(user: PortalUser | null | undefined): string {
  if (!user) return '';
  return user.name || user.email;
}

/**
 * Gets user initials for avatar display.
 */
export function getUserInitials(
  user: PortalUser | null | undefined,
  fallback: string = '?'
): string {
  if (!user) return fallback;

  const name = user.name || user.email;
  if (!name) return fallback;

  const parts = name.split(/[\s@]+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Common validation for request action pre-conditions.
 * Returns true if all required params are present.
 */
export function canPerformRequestAction(
  requestId: string | null | undefined,
  orgId: string | null | undefined,
  userData: PortalUser | null | undefined
): boolean {
  return Boolean(requestId && typeof requestId === 'string' && orgId && userData);
}

/**
 * Type guard for valid string IDs.
 */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0;
}
