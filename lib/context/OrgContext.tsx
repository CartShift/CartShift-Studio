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

import { Organization } from '@/lib/types/portal';
import { getUserOrganizations } from '@/lib/services/portal-organizations';

const STORAGE_KEY = 'cartshift_current_org_id';

interface OrgContextValue {
  /** Current organization ID */
  orgId: string | null;
  /** Whether the org context is still loading */
  loading: boolean;
  /** Switch to a different organization */
  switchOrg: (newOrgId: string) => void;
  /** List of organization IDs the user belongs to */
  organizations: string[];
  /** Full organization objects including names */
  fullOrganizations: Organization[];
  /** Whether the user has multiple organizations */
  hasMultipleOrgs: boolean;
}

const OrgContext = createContext<OrgContextValue | null>(null);

interface OrgProviderProps {
  children: ReactNode;
}

export function OrgProvider({ children }: OrgProviderProps) {
  const { userData, loading: auth } = usePortalAuth();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [fullOrganizations, setFullOrganizations] = useState<Organization[]>([]);
  const [loadingOrgs, setOrgs] = useState(false);
  const [is, setIs] = useState(false);

  // Get organizations from user data
  const organizations = useMemo(() => {
    return userData?.organizations ?? [];
  }, [userData?.organizations]);

  // Fetch full organization details when IDs change
  useEffect(() => {
    const fetchFullOrgs = async () => {
      if (organizations.length === 0) {
        setFullOrganizations([]);
        return;
      }

      setOrgs(true);
      try {
        const orgs = await getUserOrganizations(userData?.id || '');
        setFullOrganizations(orgs);
      } catch (error) {
        console.error('[OrgContext] Error fetching full organizations:', error);
      } finally {
        setOrgs(false);
      }
    };

    if (userData?.id) {
      fetchFullOrgs();
    }
  }, [organizations, userData?.id]);

  // Initialize org from storage or user's first org
  useEffect(() => {
    if (auth) return;

    // Try to load from session storage first
    const storedOrgId = sessionStorage.getItem(STORAGE_KEY);

    if (storedOrgId) {
      // If agency, we trust the stored ID. If client, we check membership.
      if (userData?.isAgency || organizations.includes(storedOrgId)) {
        setCurrentOrgId(storedOrgId);
        setIs(true);
        return;
      }
    }

    // Default behavior if no valid stored org
    if (userData?.isAgency) {
      setCurrentOrgId(null); // Agency mode by default
    } else if (organizations.length > 0) {
      const firstOrg = organizations[0];
      setCurrentOrgId(firstOrg);
      sessionStorage.setItem(STORAGE_KEY, firstOrg);
    } else {
      setCurrentOrgId(null);
    }

    setIs(true);
  }, [auth, userData?.isAgency, organizations]);

  // Switch to a different organization
  const switchOrg = useCallback(
    (newOrgId: string) => {
      // Agency users can switch to any org, clients must be members
      if (!userData?.isAgency && !organizations.includes(newOrgId)) {
        console.warn(`[OrgContext] Cannot switch to org ${newOrgId} - user is not a member`);
        return;
      }

      setCurrentOrgId(newOrgId);
      sessionStorage.setItem(STORAGE_KEY, newOrgId);

      console.log(`[OrgContext] Switched to organization: ${newOrgId}`);
    },
    [organizations, userData?.isAgency]
  );

  const value = useMemo<OrgContextValue>(
    () => ({
      orgId: currentOrgId,
      loading: auth || !is || loadingOrgs,
      switchOrg,
      organizations,
      fullOrganizations,
      hasMultipleOrgs: organizations.length > 1,
    }),
    [currentOrgId, auth, is, loadingOrgs, switchOrg, organizations, fullOrganizations]
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/**
 * Hook to access the current organization context.
 *
 * This replaces useResolvedOrgId and provides the current org ID
 * along with the ability to switch between organizations.
 *
 * @returns The organization context value
 * @throws Error if used outside of OrgProvider
 */
export function useOrg(): OrgContextValue {
  const context = useContext(OrgContext);

  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }

  return context;
}

/**
 * Hook to get just the current organization ID.
 * This is a convenience hook for components that only need the orgId.
 *
 * @returns The current organization ID or null if not available
 */
export function useOrgId(): string | null {
  const { orgId } = useOrg();
  return orgId;
}
