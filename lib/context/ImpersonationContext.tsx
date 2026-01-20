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
import { getPortalSubdomainUrl } from '@/lib/utils/portal-paths';

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
  const [impersonatedAccountId, setImpersonatedAccountId] = useState<string | null>(null);

  // Initialize from session storage
  useEffect(() => {
    const storedId = sessionStorage.getItem(STORAGE_KEY);
    if (storedId) {
      setImpersonatedAccountId(storedId);
    }
  }, []);

  const viewAsClient = useCallback((accountId: string) => {
    setImpersonatedAccountId(accountId);
    sessionStorage.setItem(STORAGE_KEY, accountId);

    // Redirect to the client's dashboard
    // Get current locale from path (e.g. /en/portal -> en)
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1] || 'en'; // default to en

    // Use subdomain URL for redirect
    window.location.href = getPortalSubdomainUrl('/dashboard/', locale);
  }, []);

  const exitImpersonation = useCallback(() => {
    setImpersonatedAccountId(null);
    sessionStorage.removeItem(STORAGE_KEY);

    // Redirect back to agency dashboard
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1] || 'en';

    window.location.href = getPortalSubdomainUrl('/agency/', locale);
  }, []);

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
