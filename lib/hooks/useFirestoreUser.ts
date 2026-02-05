import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { doc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirestoreDb } from '@/lib/firebase';
import { isLoggingOut, getAuthInstance } from '@/lib/services/auth';
import { PortalUser, AccountType, ACCOUNT_TYPE } from '@/lib/types/portal';
import { PortalErrorCode, getPortalError } from '@/lib/constants/error-codes';

export interface UserData {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string;
  accountType: AccountType;
  isAgency: boolean;
  organizations?: string[];
  notificationPreferences?: PortalUser['notificationPreferences'];
  onboardingComplete?: boolean;
  agencyRole?: import('@/lib/types/portal').UserRole;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface UseFirestoreUserOptions {
  /** Called when user data is successfully loaded */
  onUserData?: (data: UserData) => void;
  /** Called when there's no user document (new user) */
  onNoUserDocument?: (fallbackData: UserData) => void;
}

interface UseFirestoreUserResult {
  userData: UserData | null;
  loading: boolean;
  error: PortalErrorCode | null;
  refreshUserData: () => void;
}

// Helper to derive account type from existing data (for backward compatibility)
function deriveAccountType(data: Partial<PortalUser>): AccountType {
  if (data.accountType && Object.values(ACCOUNT_TYPE).includes(data.accountType)) {
    return data.accountType;
  }
  return data.isAgency ? ACCOUNT_TYPE.AGENCY : ACCOUNT_TYPE.CLIENT;
}

// Helper function to check if userData has actually changed
function userDataEqual(a: UserData | null, b: UserData | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return (
    a.id === b.id &&
    a.email === b.email &&
    a.name === b.name &&
    a.photoUrl === b.photoUrl &&
    a.accountType === b.accountType &&
    a.isAgency === b.isAgency &&
    a.onboardingComplete === b.onboardingComplete &&
    a.agencyRole === b.agencyRole &&
    JSON.stringify(a.organizations) === JSON.stringify(b.organizations) &&
    JSON.stringify(a.notificationPreferences) === JSON.stringify(b.notificationPreferences)
  );
}

// Create fallback user data from Firebase Auth user
function createFallbackUserData(user: User): UserData {
  return {
    id: user.uid,
    email: user.email || '',
    name: user.displayName || undefined,
    photoUrl: user.photoURL || undefined,
    accountType: ACCOUNT_TYPE.CLIENT,
    isAgency: false,
    organizations: [],
    onboardingComplete: false,
  };
}

/**
 * Hook for subscribing to Firestore user document.
 * Handles real-time updates and permission errors gracefully.
 */
export function useFirestoreUser(
  user: User | null,
  options: UseFirestoreUserOptions = {}
): UseFirestoreUserResult {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, set] = useState(true);
  const [error, setError] = useState<PortalErrorCode | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const pathname = usePathname();

  const refreshUserData = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  // Cleanup function for Firestore subscription
  const cleanupSubscription = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    cleanupSubscription();

    // No user - clear data and stop loading
    if (!user) {
      setUserData(null);
      set(false);
      return;
    }

    // Client-side only
    if (typeof window === 'undefined') {
      set(false);
      return;
    }

    // Use refs for callbacks to avoid re-subscription when callbacks change
    const onUserDataRef = useRef(options.onUserData);
    const onNoUserDocumentRef = useRef(options.onNoUserDocument);

    useEffect(() => {
      onUserDataRef.current = options.onUserData;
      onNoUserDocumentRef.current = options.onNoUserDocument;
    }, [options.onUserData, options.onNoUserDocument]);

    // Ensure auth token is ready before accessing Firestore
    const initSubscription = async () => {
      try {
        await user.getIdToken();
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error('[useFirestoreUser] Error getting auth token:', err);
        setError(getPortalError(err));
        setUserData(createFallbackUserData(user));
        set(false);
        return;
      }

      if (!isMountedRef.current) return;

      const db = getFirestoreDb();
      const userDocRef = doc(db, 'portal_users', user.uid);

      unsubscribeRef.current = onSnapshot(
        userDocRef,
        snapshot => {
          if (!isMountedRef.current) return;

          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<PortalUser>;
            const accountType = deriveAccountType(data);
            const newUserData: UserData = {
              id: user.uid,
              email: user.email || data.email || '',
              name: data.name || user.displayName || undefined,
              photoUrl: data.photoUrl || user.photoURL || undefined,
              accountType,
              isAgency: accountType === ACCOUNT_TYPE.AGENCY,
              organizations: data.organizations || [],
              notificationPreferences: data.notificationPreferences,
              onboardingComplete: data.onboardingComplete ?? false,
              agencyRole: data.agencyRole,
            };

            setUserData(prevData =>
              userDataEqual(prevData, newUserData) ? prevData : newUserData
            );
            onUserDataRef.current?.(newUserData);
          } else {
            // No Firestore document - create fallback
            console.warn(
              '[useFirestoreUser] No user document found for UID:',
              user.uid,
              '. Using fallback data.'
            );
            const fallbackData = createFallbackUserData(user);
            setUserData(prevData =>
              userDataEqual(prevData, fallbackData) ? prevData : fallbackData
            );
            onNoUserDocumentRef.current?.(fallbackData);
          }
          set(false);
        },
        err => {
          if (!isMountedRef.current) return;

          const isLoggingOutActive = isLoggingOut();
          const hasCurrentUser = !!getAuthInstance().currentUser;
          const isLoginPage = pathname?.includes('/login');
          const isPermissionError =
            err.code === 'permission-denied' ||
            err.message?.includes('Missing or insufficient permissions') ||
            err.message?.includes('permission');

          // Suppress permission errors during auth transitions
          if (isPermissionError) {
            if (isLoggingOutActive || !hasCurrentUser || isLoginPage) {
              return;
            }

            // User authenticated but no document yet - use fallback
            if (hasCurrentUser) {
              const fallbackData = createFallbackUserData(user);
              setUserData(prevData =>
                userDataEqual(prevData, fallbackData) ? prevData : fallbackData
              );
              set(false);
              return;
            }
          }

          // Log non-expected errors
          if (
            !isPermissionError ||
            (isPermissionError && hasCurrentUser && !isLoggingOutActive && !isLoginPage)
          ) {
            console.error('[useFirestoreUser] Error fetching user data:', err);
          }

          setError(getPortalError(err));
          set(false);
        }
      );
    };

    initSubscription();

    return () => {
      isMountedRef.current = false;
      cleanupSubscription();
    };
  }, [user, refreshKey, pathname, cleanupSubscription]); // Removed options from dependency

  return {
    userData,
    loading,
    error,
    refreshUserData,
  };
}
