import { useState, useEffect, useRef } from 'react';
import { getAuthInstance, isLoggingOut } from '@/lib/services/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';

interface UseFirebaseAuthResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isLoggingOut: boolean;
}

/**
 * Hook for basic Firebase Authentication state.
 * Handles auth state changes and provides the current user.
 * This is a low-level hook - prefer usePortalAuth for most use cases.
 */
export function useFirebaseAuth(): UseFirebaseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, set] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getAuthInstance();

      unsubscribe = onAuthStateChanged(
        auth,
        currentUser => {
          if (!isMountedRef.current) return;
          setUser(currentUser);
          set(false);
        },
        err => {
          if (!isMountedRef.current) return;
          console.error('[useFirebaseAuth] Auth state error:', err);
          setError(err);
          set(false);
        }
      );
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('[useFirebaseAuth] Initialization error:', err);
      setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      set(false);
    }

    return () => {
      isMountedRef.current = false;
      unsubscribe?.();
    };
  }, []);

  return {
    user,
    loading,
    error,
    isLoggingOut: isLoggingOut(),
  };
}
