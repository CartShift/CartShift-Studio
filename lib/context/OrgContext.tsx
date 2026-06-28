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
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useUserOrganizations } from '@/lib/hooks/useUserOrganizations';
import type { Organization } from '@/lib/types/portal';

const STORAGE_KEY = 'cartshift_current_org_id';

interface OrgContextValue {
  orgId: string | null;
  loading: boolean;
  switchOrg: (newOrgId: string) => void;
  organizations: string[];
  fullOrganizations: Organization[];
  hasMultipleOrgs: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const { userData, loading: auth } = usePortalAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const organizations = useMemo(() => userData?.organizations ?? [], [userData?.organizations]);

  const {
    data: fullOrganizations = [],
    isLoading: loadingOrgs,
  } = useUserOrganizations();

  useEffect(() => {
    if (auth) return;

    const storedOrgId = sessionStorage.getItem(STORAGE_KEY);

    if (storedOrgId) {
      if (userData?.isAgency || organizations.includes(storedOrgId)) {
        setCurrentOrgId(storedOrgId);
        setIsInitialized(true);
        return;
      }
    }

    if (userData?.isAgency) {
      setCurrentOrgId(null);
    } else if (organizations.length > 0) {
      const firstOrg = organizations[0];
      setCurrentOrgId(firstOrg);
      sessionStorage.setItem(STORAGE_KEY, firstOrg);
    } else {
      setCurrentOrgId(null);
    }

    setIsInitialized(true);
  }, [auth, userData?.isAgency, organizations]);

  const switchOrg = useCallback(
    (newOrgId: string) => {
      if (!userData?.isAgency && !organizations.includes(newOrgId)) {
        console.warn(`[OrgContext] Cannot switch to org ${newOrgId} - user is not a member`);
        return;
      }

      setCurrentOrgId(newOrgId);
      sessionStorage.setItem(STORAGE_KEY, newOrgId);
    },
    [organizations, userData?.isAgency]
  );

  const value = useMemo<OrgContextValue>(
    () => ({
      orgId: currentOrgId,
      loading: auth || !isInitialized || loadingOrgs,
      switchOrg,
      organizations,
      fullOrganizations,
      hasMultipleOrgs: organizations.length > 1,
    }),
    [currentOrgId, auth, isInitialized, loadingOrgs, switchOrg, organizations, fullOrganizations]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}

export function useOrgId(): string | null {
  const { orgId } = useOrg();
  return orgId;
}
