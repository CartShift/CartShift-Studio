/**
 * Firestore Helper Utilities
 *
 * Provides utilities to safely handle Firestore operations with proper
 * error handling for permission errors during auth transitions.
 */

import { getFirebaseAuth } from '@/lib/firebase';
import { isLoggingOut } from '@/lib/services/auth';
import type { FirestoreError } from 'firebase/firestore';

/**
 * Checks if an error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  const firestoreError = error as FirestoreError;
  return (
    firestoreError?.code === 'permission-denied' ||
    firestoreError?.message?.includes('Missing or insufficient permissions') ||
    firestoreError?.message?.includes('permission')
  );
}

/**
 * Checks if a permission error should be suppressed
 * (e.g., during auth transitions, logout, or on login pages)
 */
export function shouldSuppressPermissionError(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;

    // Suppress if no user (expected during logout)
    if (!currentUser) return true;

    // Suppress if we're in the process of logging out
    if (isLoggingOut()) return true;

    // Suppress on login/signup pages
    const pathname = window.location.pathname;
    if (pathname.includes('/login') || pathname.includes('/signup')) {
      return true;
    }

    return false;
  } catch {
    // Auth not initialized - suppress
    return true;
  }
}

/**
 * Wraps a Firestore error handler to suppress expected permission errors
 */
export function wrapFirestoreErrorHandler<TArgs extends any[], TReturn>(
  handler: (...args: TArgs) => TReturn,
  context?: string
): (...args: TArgs) => TReturn {
  return (...args: TArgs) => {
    const error = args[0];

    if (isPermissionError(error) && shouldSuppressPermissionError()) {
      // Suppress expected permission errors
      if (context && process.env.NODE_ENV === 'development') {
        console.debug(`[${context}] Suppressed permission error during auth transition`);
      }
      return undefined as unknown as TReturn;
    }

    // Call original handler for all other errors
    return handler(...args);
  };
}

/**
 * Creates a safe error handler for onSnapshot that suppresses expected permission errors
 */
export function createSafeSnapshotErrorHandler(
  onError?: (error: FirestoreError) => void,
  context?: string
): (error: FirestoreError) => void {
  return (error: FirestoreError) => {
    if (isPermissionError(error) && shouldSuppressPermissionError()) {
      // Suppress expected permission errors
      if (context && process.env.NODE_ENV === 'development') {
        console.debug(`[${context}] Suppressed permission error during auth transition`);
      }
      return;
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error);
    } else {
      // Default: only log non-permission errors
      if (!isPermissionError(error)) {
        console.error(`[${context || 'Firestore'}] Error:`, error);
      }
    }
  };
}
