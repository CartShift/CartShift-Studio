import { useMemo, useCallback, useEffect } from 'react';
import { useImpersonation } from '@/lib/context/ImpersonationContext';
import { ACCOUNT_TYPE } from '@/lib/types/portal';
import { PortalErrorCode } from '@/lib/constants/error-codes';
import { useFirebaseAuth } from './useFirebaseAuth';
import { useFirestoreUser, type UserData } from './useFirestoreUser';
import { useUserCache, getInitialCachedUserData } from './useUserCache';

// Re-export UserData type for backward compatibility
export type { UserData } from './useFirestoreUser';

interface UsePortalAuthResult {
  user: import('firebase/auth').User | null;
  userData: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAgency: boolean;
  accountType: import('@/lib/types/portal').AccountType;
  error: import('@/lib/constants/error-codes').PortalErrorCode | null;
  isImpersonating: boolean;
  impersonatedAccountId: string | null;
}

/**
 * Main portal authentication hook.
 * Composes useFirebaseAuth, useFirestoreUser, and useUserCache
 * to provide complete auth state with impersonation support.
 */
export function usePortalAuth(): UsePortalAuthResult {
  // 1. Get Firebase auth state
  const { user, loading: auth, error: authError } = useFirebaseAuth();

  // 2. Get user cache utilities
  const { updateCache, clearCache } = useUserCache();

  // 3. Get cached data for initial render (prevents flicker)
  const initialCachedData = useMemo(() => getInitialCachedUserData(), []);

  // 4. Cache update callback
  const handleUserData = useCallback(
    (data: UserData) => {
      updateCache(data);
    },
    [updateCache]
  );

  // 5. Handle no user document (new user or edge case)
  const handleNoUserDocument = useCallback(() => {
    clearCache();
  }, [clearCache]);

  // 6. Subscribe to Firestore user document
  const {
    userData: firestoreUserData,
    loading: firestore,
    error: firestoreError,
  } = useFirestoreUser(user, {
    onUserData: handleUserData,
    onNoUserDocument: handleNoUserDocument,
  });

  // 7. Clear cache when user logs out
  useEffect(() => {
    if (!user) {
      clearCache();
    }
  }, [user, clearCache]);

  // 8. Get impersonation state (safe to call - ImpersonationContext is above OrgContext)
  const { isImpersonating, impersonatedAccountId } = useImpersonationSafe();

  // 9. Combine loading states
  const loading = auth || firestore;

  // 10. Use Firestore data or fall back to cached data
  const userData: UserData | null = firestoreUserData || (initialCachedData as UserData | null);

  // 11. Get error (prefer Firestore error as it's more specific)
  const error = firestoreError || (authError ? PortalErrorCode.UNKNOWN_ERROR : null);

  // 12. Calculate base values
  const baseIsAgency = userData?.accountType === ACCOUNT_TYPE.AGENCY;
  const baseAccountType = userData?.accountType || ACCOUNT_TYPE.CLIENT;

  // 13. Apply impersonation overrides
  const finalUserData = useMemo(() => {
    if (isImpersonating && impersonatedAccountId && baseIsAgency && userData) {
      return {
        ...userData,
        accountType: ACCOUNT_TYPE.CLIENT,
        isAgency: false,
        organizations: [impersonatedAccountId],
      };
    }
    return userData;
  }, [userData, isImpersonating, impersonatedAccountId, baseIsAgency]);

  const finalIsAgency = isImpersonating && impersonatedAccountId ? false : baseIsAgency;
  const finalAccountType =
    isImpersonating && impersonatedAccountId ? ACCOUNT_TYPE.CLIENT : baseAccountType;

  return {
    user,
    userData: finalUserData,
    loading,
    isAuthenticated: !!user || !!userData,
    isAgency: finalIsAgency,
    accountType: finalAccountType,
    error,
    isImpersonating: !!(isImpersonating && impersonatedAccountId),
    impersonatedAccountId,
  };
}

/**
 * Safe wrapper for useImpersonation that returns defaults if context is unavailable.
 * This prevents errors when usePortalAuth is used outside ImpersonationProvider.
 */
function useImpersonationSafe() {
  try {
    return useImpersonation();
  } catch {
    return { isImpersonating: false, impersonatedAccountId: null };
  }
}
