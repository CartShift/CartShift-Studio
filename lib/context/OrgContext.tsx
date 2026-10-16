'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useUserOrganizations } from '@/lib/hooks/useUserOrganizations';
import type { Organization } from '@/lib/types/portal';

// Selection is per authenticated user, not per tab or agency role.
// The legacy unscoped storage key must not restore another user's workspace.
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

export function OrgProvider({ children }: { children: ReactNode }) {
  const { userData, loading: auth } = usePortalAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  const organizations = useMemo(
    () => [...new Set(userData?.organizations ?? [])],
    [userData?.organizations]
  );
  const userId = userData?.id ?? null;
  const storageKey = userId ? `${STORAGE_KEY}:${userId}` : null;
  const isAgencyWorkspace = userData?.isAgency === true;

  const { data: fetchedOrganizations = [], isLoading: loadingOrgs } = useUserOrganizations();
  const fullOrganizations = useMemo(
    () => fetchedOrganizations.filter(org => organizations.includes(org.id)),
    [fetchedOrganizations, organizations]
  );

  useEffect(() => {
    if (auth || !storageKey) {
      setCurrentOrgId(null);
      setInitializedFor(null);
      return;
    }

    // An agency workspace is global. Selecting a client is an explicit
    // "view as client" action, never an implicit organization switch.
    if (isAgencyWorkspace) {
      setCurrentOrgId(null);
      setInitializedFor(storageKey);
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const storedId = sessionStorage.getItem(storageKey);
    const selected = storedId && organizations.includes(storedId)
      ? storedId : (organizations[0] ?? null);
    setCurrentOrgId(selected);
    setInitializedFor(storageKey);
    if (selected) sessionStorage.setItem(storageKey, selected);
    else sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(STORAGE_KEY);
  }, [auth, storageKey, isAgencyWorkspace, organizations]);

  // A stale choice cannot leak through during account / impersonation changes.
  const orgId = !userId || isAgencyWorkspace || initializedFor !== storageKey
    ? null
    : currentOrgId && organizations.includes(currentOrgId)
      ? currentOrgId
      : (organizations[0] ?? null);

  const switchOrg = useCallback((newOrgId: string) => {
    if (isAgencyWorkspace || !storageKey || !organizations.includes(newOrgId)) {
      return;
    }
    setCurrentOrgId(newOrgId);
    sessionStorage.setItem(storageKey, newOrgId);
  }, [isAgencyWorkspace, storageKey, organizations]);

  const value = useMemo<OrgContextValue>(() => ({
    orgId,
    loading: auth || !userId || initializedFor !== storageKey ||
      (!isAgencyWorkspace && loadingOrgs),
    switchOrg,
    organizations,
    fullOrganizations,
    hasMultipleOrgs: !isAgencyWorkspace && fullOrganizations.length > 1,
  }), [orgId, auth, userId, initializedFor, storageKey, isAgencyWorkspace,
    loadingOrgs, switchOrg, organizations, fullOrganizations]);

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);
  if (!context) throw new Error('useOrg must be used within an OrgProvider');
  return context;
}

export function useOrgId(): string | null {
  return useOrg().orgId;
}
