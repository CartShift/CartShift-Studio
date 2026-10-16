'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useFirebaseAuth } from '@/lib/hooks/useFirebaseAuth';

const STORAGE_KEY = 'cartshift_impersonated_account_id';

interface ImpersonationContextValue {
  /** The ID of the account currently being impersonated, or null if not impersonating */
  impersonatedAccountId: string | null;
  /** Start impersonating a client account */
  viewAsClient: (accountId: string) => void;
  /** Stop impersonating and return to agency view */
  exitImpersonation: () => void;
  /** Whether the user is currently impersonating another account */
  isImpersonating: boolean;
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useFirebaseAuth();
  const [selectedClient, setSelectedClient] = useState<{
    uid: string; orgId: string;
  } | null>(null);
  const uid = user?.uid ?? null;
  const storageKey = uid ? `${STORAGE_KEY}:${uid}` : null;
  const impersonatedAccountId = !loading && uid && selectedClient?.uid === uid
    ? selectedClient.orgId : null;

  // Restore an explicit client view only for the SAME Firebase identity.
  useEffect(() => {
    if (loading) return;
    const storedId = storageKey ? sessionStorage.getItem(storageKey) : null;
    setSelectedClient(uid && storedId ? { uid, orgId: storedId } : null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, [loading, uid, storageKey]);

  const viewAsClient = useCallback((accountId: string) => {
    if (!uid || !storageKey) return;
    setSelectedClient({ uid, orgId: accountId });
    sessionStorage.setItem(storageKey, accountId);

    // Redirect to the client's dashboard using context-aware path
    window.location.href = getPortalPath('/dashboard/');
  }, [uid, storageKey]);

  const exitImpersonation = useCallback(() => {
    setSelectedClient(null);
    if (storageKey) sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(STORAGE_KEY);

    // Redirect back to agency dashboard using context-aware path

    window.location.href = getPortalPath('/agency/');
  }, [storageKey]);

  const value = useMemo(
    () => ({
      impersonatedAccountId,
      viewAsClient,
      exitImpersonation,
      isImpersonating: !!impersonatedAccountId,
    }),
    [impersonatedAccountId, viewAsClient, exitImpersonation]
  );

  return <ImpersonationContext.Provider value={value}>{children}</ImpersonationContext.Provider>;
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
