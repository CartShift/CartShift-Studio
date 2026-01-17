/**
 * UI Constants
 *
 * Centralized configuration for UI-related constants.
 * Eliminates magic numbers scattered throughout the codebase.
 */

/**
 * Navigation scroll behavior configuration
 */
export const NAVIGATION_CONFIG = {
  /** Minimum scroll position before triggering navigation changes */
  SCROLL_THRESHOLD: 10,
  /** Scroll threshold for hiding navigation */
  SCROLL_DOWN_THRESHOLD: 50,
  /** Minimum scroll difference to trigger visibility change */
  SCROLL_DIFF_THRESHOLD: 5,
  /** Scroll position to hide navigation entirely */
  SCROLL_HIDE_THRESHOLD: 100,
} as const;

/**
 * UI element dimensions
 */
export const UI_DIMENSIONS = {
  /** Notification dropdown width in pixels */
  NOTIFICATION_DROPDOWN_WIDTH: 384,
  /** Sidebar expanded width */
  SIDEBAR_EXPANDED_WIDTH: 256,
  /** Sidebar collapsed width */
  SIDEBAR_COLLAPSED_WIDTH: 64,
  /** Mobile breakpoint in pixels */
  MOBILE_BREAKPOINT: 768,
  /** Tablet breakpoint in pixels */
  TABLET_BREAKPOINT: 1024,
} as const;

/**
 * Animation and timing configuration
 */
export const TIMING_CONFIG = {
  /** Default debounce delay in milliseconds */
  DEBOUNCE_DELAY: 300,
  /** Default throttle delay in milliseconds */
  THROTTLE_DELAY: 100,
  /** Transition duration in milliseconds */
  TRANSITION_DURATION: 300,
  /** Toast notification duration in milliseconds */
  TOAST_DURATION: 5000,
  /** Autosave delay in milliseconds */
  AUTOSAVE_DELAY: 2000,
} as const;

/**
 * Query and cache configuration
 */
export const CACHE_CONFIG = {
  /** Default stale time for queries (5 minutes) */
  STALE_TIME: 5 * 60 * 1000,
  /** Default cache time for queries (30 minutes) */
  CACHE_TIME: 30 * 60 * 1000,
  /** Retry count for failed queries */
  RETRY_COUNT: 3,
  /** Retry delay between attempts in milliseconds */
  RETRY_DELAY: 1000,
} as const;

/**
 * Form validation configuration
 */
export const VALIDATION_CONFIG = {
  /** Minimum password length */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum password length */
  MAX_PASSWORD_LENGTH: 128,
  /** Maximum name length */
  MAX_NAME_LENGTH: 100,
  /** Maximum email length */
  MAX_EMAIL_LENGTH: 254,
  /** Maximum message length for forms */
  MAX_MESSAGE_LENGTH: 5000,
} as const;
