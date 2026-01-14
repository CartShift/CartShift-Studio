import { useState, useEffect, useRef, startTransition } from 'react';
import { usePathname } from 'next/navigation';
import { getAuthInstance, isLoggingOut } from '@/lib/services/auth';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PortalUser, AccountType, ACCOUNT_TYPE } from '@/lib/types/portal';
import { PortalErrorCode, getPortalError } from '@/lib/constants/error-codes';

interface UserData {
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
}

// Helper to derive account type from existing data (for backward compatibility)
function deriveAccountType(data: Partial<PortalUser>): AccountType {
  // If accountType is explicitly set, use it
  if (data.accountType && Object.values(ACCOUNT_TYPE).includes(data.accountType)) {
    return data.accountType;
  }
  // Fall back to isAgency field for backward compatibility
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
    a.agencyRole === b.agencyRole && // Added check
    JSON.stringify(a.organizations) === JSON.stringify(b.organizations) &&
    JSON.stringify(a.notificationPreferences) === JSON.stringify(b.notificationPreferences)
  );
}

export function usePortalAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PortalErrorCode | null>(null);
  const isMountedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeUserData: (() => void) | undefined;

    // Load cached data asynchronously to avoid state updates during render
    const loadCache = () => {
      if (!isMountedRef.current) return;
      try {
        const cached = localStorage.getItem('portal_user_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          // Only use cache if it's less than 1 hour old to avoid very stale data
          const cacheTime = parsed._cacheTime;
          if (cacheTime && Date.now() - cacheTime < 1000 * 60 * 60) {
            // Use startTransition to ensure state updates happen after mount
            startTransition(() => {
              if (isMountedRef.current) {
                setUserData(prevData => (userDataEqual(prevData, parsed) ? prevData : parsed));
                // Set loading to false temporarily to show cached data
                // Real data will update this shortly
                setLoading(false);
              }
            });
          }
        }
      } catch (e) {
        console.error('Error reading auth cache:', e);
      }
    };

    // Use requestAnimationFrame to defer cache loading until after mount, avoiding render-phase updates
    let rafId: number | null = null;
    if (typeof window !== 'undefined') {
      rafId = requestAnimationFrame(() => {
        if (isMountedRef.current) {
          loadCache();
        }
      });
    }

    try {
      const auth = getAuthInstance();

      // Listen to auth state changes
      unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
        if (!isMountedRef.current) return;

        // CRITICAL: Unsubscribe from previous user data listener to prevent
        // "Missing or insufficient permissions" errors when the user logs out.
        if (unsubscribeUserData) {
          console.log('[usePortalAuth] Cleaning up previous userData listener');
          unsubscribeUserData();
          unsubscribeUserData = undefined;
        }

        setUser(currentUser);

        if (currentUser) {
          // Ensure auth token is ready before accessing Firestore
          try {
            await currentUser.getIdToken();
          } catch (err) {
            if (!isMountedRef.current) return;
            console.error('Error getting auth token:', err);
            setError(getPortalError(err));
            const fallbackData = {
              id: currentUser.uid,
              email: currentUser.email || '',
              name: currentUser.displayName || undefined,
              photoUrl: currentUser.photoURL || undefined,
              accountType: ACCOUNT_TYPE.CLIENT,
              isAgency: false,
            };
            setUserData(prevData =>
              userDataEqual(prevData, fallbackData) ? prevData : fallbackData
            );
            setLoading(false);
            return;
          }

          // Subscribe to user data from Firestore
          const userDocRef = doc(db, 'portal_users', currentUser.uid);
          unsubscribeUserData = onSnapshot(
            userDocRef,
            snapshot => {
              if (!isMountedRef.current) return;
              if (snapshot.exists()) {
                const data = snapshot.data() as Partial<PortalUser>;
                const accountType = deriveAccountType(data);
                const newUserData: UserData = {
                  id: currentUser.uid,
                  email: currentUser.email || data.email || '',
                  name: data.name || currentUser.displayName || undefined,
                  photoUrl: data.photoUrl || currentUser.photoURL || undefined,
                  accountType,
                  isAgency: accountType === ACCOUNT_TYPE.AGENCY,
                  organizations: data.organizations || [],
                  notificationPreferences: data.notificationPreferences,
                  onboardingComplete: data.onboardingComplete ?? false,
                  agencyRole: data.agencyRole,
                };

                console.log('[usePortalAuth] User data loaded from Firestore:', {
                  uid: currentUser.uid,
                  accountType: newUserData.accountType,
                  orgCount: newUserData.organizations?.length || 0,
                });
                setUserData(prevData =>
                  userDataEqual(prevData, newUserData) ? prevData : newUserData
                );

                // Update cache
                localStorage.setItem(
                  'portal_user_data',
                  JSON.stringify({
                    ...newUserData,
                    _cacheTime: Date.now(),
                  })
                );
              } else {
                // Fallback to auth user data if no Firestore doc
                console.warn(
                  '[usePortalAuth] No user document found in Firestore for UID:',
                  currentUser.uid,
                  '. Using fallback data.'
                );
                const fallbackData = {
                  id: currentUser.uid,
                  email: currentUser.email || '',
                  name: currentUser.displayName || undefined,
                  photoUrl: currentUser.photoURL || undefined,
                  accountType: ACCOUNT_TYPE.CLIENT,
                  isAgency: false,
                  organizations: [],
                  // Added for consistency with PortalUser type, though not directly from auth
                  createdAt: null as any,
                  updatedAt: null as any,
                };
                setUserData(prevData =>
                  userDataEqual(prevData, fallbackData) ? prevData : fallbackData
                );
                // Clear cache if user exists in Auth but not Firestore (rare edge case or new user)
                localStorage.removeItem('portal_user_data');
              }
              setLoading(false);
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

                // If user is authenticated but gets permission error, they might not have a user document yet
                // This is expected for new users - handle gracefully
                if (hasCurrentUser) {
                  const fallbackData: UserData = {
                    id: currentUser.uid,
                    email: currentUser.email || '',
                    name: currentUser.displayName || undefined,
                    photoUrl: currentUser.photoURL || undefined,
                    accountType: ACCOUNT_TYPE.CLIENT,
                    isAgency: false,
                    organizations: [],
                    onboardingComplete: false,
                  };
                  setUserData(prevData =>
                    userDataEqual(prevData, fallbackData) ? prevData : fallbackData
                  );
                  setLoading(false);
                  return;
                }
              }

              // Only log non-permission errors or permission errors that aren't during transitions
              if (
                !isPermissionError ||
                (isPermissionError && hasCurrentUser && !isLoggingOutActive && !isLoginPage)
              ) {
                console.error('[usePortalAuth] Error fetching user data:', err);
              }

              setError(getPortalError(err));
              setLoading(false);
            }
          );
        } else {
          if (!isMountedRef.current) return;
          setUserData(null);
          localStorage.removeItem('portal_user_data');
          setLoading(false);
        }
      });
    } catch (err) {
      if (!isMountedRef.current) return;
      console.error('Auth initialization error:', err);
      setError(getPortalError(err));
      setLoading(false);
    }

    // Cleanup subscriptions on unmount
    return () => {
      isMountedRef.current = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
    };
  }, []);

  // Integrating Impersonation
  // We need to use useContext directly because using useImpersonation() hook
  // might cause circular dependencies if we move it to a common file,
  // but since we are modifying usePortalAuth here and imported it, let's try to be safe.
  // Actually, hooks rules say we can call hooks. However, usePortalAuth is used by OrgContext
  // and ImpersonationContext is ABOVE OrgContext, so it should be fine.
  // But wait! ImpersonationProvider wraps OrgProvider.
  // usePortalAuth is used inside OrgContext. So calling useImpersonation inside usePortalAuth is SAFE.

  // Note: We need a way to access the context without throwing if the provider isn't there
  // (e.g. on pages that use usePortalAuth but aren't inside the PortalProviders, though unlikely).
  // For now, let's assume it's safe or we can handle the error.

  // However, usePortalAuth is often used at top levels.
  // Let's use a safe dynamic import or check for the context availability?
  // Actually, standard context usage is fine.

  // WAIT: We can't easily import useImpersonation because of valid cyclic concerns if ImpersonationContext imports things that import usePortalAuth.
  // ImpersonationContext DOES NOT import usePortalAuth. It uses simple state.
  // BUT... usePortalAuth is used in `OrgProvider`. `OrgProvider` is children of `ImpersonationProvider`.
  // So inside `OrgProvider` -> `usePortalAuth` -> `useImpersonation` -> `useContext(ImpersonationContext)` which is provided up the tree.
  // This is SAFE.

  // Let's modify the return statement to override data.

  // We need to fetch the context.
  const { isImpersonating, impersonatedAccountId } = useImpersonationSafe();

  const finalUser = user;

  let finalUserData = userData;
  let finalIsAgency = userData?.accountType === ACCOUNT_TYPE.AGENCY;
  let finalAccountType = userData?.accountType || ACCOUNT_TYPE.CLIENT;

  if (isImpersonating && impersonatedAccountId && finalIsAgency) {
    // Override for impersonation
    finalIsAgency = false;
    finalAccountType = ACCOUNT_TYPE.CLIENT;
    finalUserData = userData
      ? {
          ...userData,
          accountType: ACCOUNT_TYPE.CLIENT,
          isAgency: false,
          organizations: [impersonatedAccountId], // Force them to only see this org
        }
      : null;

    // Log once for debugging
    // console.log('Impersonating:', impersonatedAccountId);
  }

  return {
    user: finalUser,
    userData: finalUserData,
    loading,
    isAuthenticated: !!finalUser || !!finalUserData,
    isAgency: finalIsAgency,
    accountType: finalAccountType,
    error,
  };
}

// Helper to safely usage context to avoid issues if used outside provider
// We need to import the context object itself, but it is not exported from the file in the way we usually do
// We might need to modify ImpersonationContext to export the Context object or a safe hook.
// For now let's import the hook we created.
import { useImpersonation } from '@/lib/context/ImpersonationContext';

function useImpersonationSafe() {
  try {
    return useImpersonation();
  } catch (e) {
    return { isImpersonating: false, impersonatedAccountId: null };
  }
}
