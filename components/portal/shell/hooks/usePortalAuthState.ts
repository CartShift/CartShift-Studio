'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useOrg } from '@/lib/context/OrgContext';
import { getMemberByUserId, ensureMembership } from '@/lib/services/portal-organizations';
import { isLoggingOut } from '@/lib/services/auth';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Logger } from '@/lib/logger';
import type { UserRole } from '@/lib/types/portal';

interface UsePortalAuthStateOptions {
  orgIdProp?: string;
  isAgencyPage?: boolean;
}

interface UsePortalAuthStateResult {
  // Auth data
  userData: ReturnType<typeof usePortalAuth>['userData'];
  displayUserData: ReturnType<typeof usePortalAuth>['userData'];
  loading: boolean;
  accountType: ReturnType<typeof usePortalAuth>['accountType'];
  isAgency: boolean;
  isImpersonating: boolean;
  impersonatedAccountId: string | null;

  // Org data
  effectiveOrgId: string | undefined;
  hasMultipleOrgs: boolean;
  fullOrganizations: ReturnType<typeof useOrg>['fullOrganizations'];
  switchOrg: ReturnType<typeof useOrg>['switchOrg'];

  // Authorization
  isAuthorized: boolean | null;
  memberRole: UserRole | undefined;
  hasEverBeenAuthorized: boolean;

  //  states
  initialLoadComplete: boolean;
}

/**
 * Hook for managing portal authentication and authorization state.
 * Handles user data, organization access, and impersonation.
 */
export function usePortalAuthState({
  orgIdProp,
  isAgencyPage = false,
}: UsePortalAuthStateOptions): UsePortalAuthStateResult {
  const router = useRouter();
  const {
    userData,
    loading,
    isAuthenticated,
    accountType,
    isImpersonating,
    impersonatedAccountId,
  } = usePortalAuth();
  const { orgId: contextOrgId, hasMultipleOrgs, fullOrganizations, switchOrg } = useOrg();

  // Derived values
  const effectiveOrgId = contextOrgId ?? orgIdProp;
  const isAgency = isAgencyPage || userData?.isAgency;

  // Authorization state
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [memberRole, setMemberRole] = useState<UserRole | undefined>(undefined);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const hasEverBeenAuthorizedRef = useRef(false);

  // Calculate Display User Data for Impersonation
  const displayUserData = useMemo(() => {
    if (isImpersonating && impersonatedAccountId && userData) {
      const org = fullOrganizations.find((o) => o.id === impersonatedAccountId);
      if (org) {
        return {
          ...userData,
          name: org.name,
          photoUrl: org.branding?.iconUrl || org.logoUrl || userData.photoUrl,
        };
      }
    }
    return userData;
  }, [userData, isImpersonating, impersonatedAccountId, fullOrganizations]);

  // Mount effect - handle initial load optimization
  useEffect(() => {
    if (userData) {
      setInitialLoadComplete(true);

      // Optimistically set authorization based on cache
      if (userData.isAgency || userData.accountType === 'AGENCY') {
        setIsAuthorized(true);
        setMemberRole(userData.agencyRole || 'owner');
      } else if (effectiveOrgId && userData.organizations?.includes(effectiveOrgId)) {
        setIsAuthorized(true);
      } else if (!effectiveOrgId) {
        setIsAuthorized(true);
      }
    }
  }, [userData, effectiveOrgId]);

  // Access check effect
  useEffect(() => {
    let internalMounted = true;

    const isReadyToCheck = !loading || !!userData;

    if (isReadyToCheck) {
      if (!initialLoadComplete && userData) {
        setInitialLoadComplete(true);
      }

      if (!isAuthenticated && !loading) {
        if (!isLoggingOut()) {
          router.push(getPortalPath('/login/'));
        }
        return;
      }

      const checkAccess = async () => {
        try {
          if (!userData) return;

          if (isImpersonating && impersonatedAccountId) {
            if (internalMounted) {
              setIsAuthorized(true);
              setMemberRole(undefined);
              hasEverBeenAuthorizedRef.current = true;
            }
            return;
          }

          if (effectiveOrgId) {
            if (userData.isAgency || userData.accountType === 'AGENCY') {
              if (internalMounted) {
                setIsAuthorized(true);
                setMemberRole(userData.agencyRole || 'owner');
                hasEverBeenAuthorizedRef.current = true;
              }
              return;
            }

            if (effectiveOrgId === 'template') {
              if (internalMounted) {
                setIsAuthorized(true);
                setMemberRole('owner');
                hasEverBeenAuthorizedRef.current = true;
              }
              return;
            }

            let member = await getMemberByUserId(effectiveOrgId, userData.id);
            if (!member) {
              member = await ensureMembership(
                effectiveOrgId,
                userData.id,
                userData.email,
                userData.name
              );
            }

            if (internalMounted) {
              const authorized = member !== null;
              setIsAuthorized(authorized);
              if (member) setMemberRole(member.role);
              if (authorized) hasEverBeenAuthorizedRef.current = true;
            }
          } else if (isAgencyPage) {
            const authorized = Boolean(userData.isAgency) || userData.accountType === 'AGENCY';
            if (internalMounted) {
              setIsAuthorized(authorized);
              if (authorized) {
                setMemberRole(userData.agencyRole || 'owner');
                hasEverBeenAuthorizedRef.current = true;
              }
            }
          } else {
            if (internalMounted) {
              setIsAuthorized(true);
              hasEverBeenAuthorizedRef.current = true;
            }
          }
        } catch (error) {
          Logger.error('Error checking access', error);
          if (internalMounted) setIsAuthorized(false);
        }
      };

      checkAccess();
    }

    return () => {
      internalMounted = false;
    };
  }, [
    loading,
    isAuthenticated,
    userData,
    effectiveOrgId,
    isAgencyPage,
    router,
    isImpersonating,
    impersonatedAccountId,
    initialLoadComplete,
  ]);

  return {
    userData,
    displayUserData,
    loading,
    accountType,
    isAgency: !!isAgency,
    isImpersonating,
    impersonatedAccountId,
    effectiveOrgId,
    hasMultipleOrgs,
    fullOrganizations,
    switchOrg,
    isAuthorized,
    memberRole,
    hasEverBeenAuthorized: hasEverBeenAuthorizedRef.current,
    initialLoadComplete,
  };
}
