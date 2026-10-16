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
    () => isAgencyWorkspace ? fetchedOrganizations :
      fetchedOrganizations.filter(org => organizations.includes(org.id)),
    [fetchedOrganizations, organizations, isAgencyWorkspace]
  );

  useEffect(() => {
    if (auth || !storageKey) {
      setCurrentOrgId(null);
      setInitializedFor(null);
      return;
    }

    // For agency staff, this is a working-client filter, NOT a change of identity.
    // It is optional; "all clients" is the default.
    if (isAgencyWorkspace) {
      const storedId = sessionStorage.getItem(storageKey);
      setCurrentOrgId(storedId || null);
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
  const orgId = !userId || initializedFor !== storageKey
    ? null
    : isAgencyWorkspace
      ? currentOrgId
      : currentOrgId && organizations.includes(currentOrgId)
        ? currentOrgId
        : (organizations[0] ?? null);

  const switchOrg = useCallback((newOrgId: string) => {
    if (!storageKey) return;
    if (isAgencyWorkspace) {
      // Agency workflows can explicitly select any client they are permitted
      // to manage. Authorization remains enforced by Firestore/API rules.
      const selected = newOrgId.trim().slice(0, 128);
      setCurrentOrgId(selected || null);
      if (selected) sessionStorage.setItem(storageKey, selected);
      else sessionStorage.removeItem(storageKey);
      return;
    }
    if (!organizations.includes(newOrgId)) return;
    setCurrentOrgId(newOrgId);
    sessionStorage.setItem(storageKey, newOrgId);
  }, [isAgencyWorkspace, storageKey, organizations]);

  const value = useMemo<OrgContextValue>(() => ({
    orgId,
    // Signed-out sessions must finish loading so the portal can redirect to login.
    loading: auth || (Boolean(userId) && (
      initializedFor !== storageKey || loadingOrgs
    )),
    switchOrg,
    organizations,
    fullOrganizations,
    hasMultipleOrgs: isAgencyWorkspace
      ? fullOrganizations.length > 0 || Boolean(orgId)
      : fullOrganizations.length > 1,
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
