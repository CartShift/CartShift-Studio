'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useOrg } from '@/lib/context/OrgContext';
import { getMemberByUserId } from '@/lib/services/portal-organizations';
import { isLoggingOut } from '@/lib/services/auth';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { Logger } from '@/lib/logger';
import type { UserRole } from '@/lib/types/portal';

interface UsePortalAuthStateOptions {
  orgIdProp?: string;
  isAgencyPage?: boolean;
}

interface UsePortalAuthStateResult {
  userData: ReturnType<typeof usePortalAuth>['userData'];
  displayUserData: ReturnType<typeof usePortalAuth>['userData'];
  loading: boolean;
  accountType: ReturnType<typeof usePortalAuth>['accountType'];
  isAgency: boolean;
  isImpersonating: boolean;
  impersonatedAccountId: string | null;
  effectiveOrgId: string | undefined;
  hasMultipleOrgs: boolean;
  fullOrganizations: ReturnType<typeof useOrg>['fullOrganizations'];
  switchOrg: ReturnType<typeof useOrg>['switchOrg'];
  isAuthorized: boolean | null;
  memberRole: UserRole | undefined;
  hasEverBeenAuthorized: boolean;
  initialLoadComplete: boolean;
}

/**
 * Portal authentication and authorization — fails closed; no membership auto-provisioning.
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

  const effectiveOrgId = contextOrgId ?? orgIdProp;
  const isAgency = isAgencyPage || userData?.isAgency;

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [memberRole, setMemberRole] = useState<UserRole | undefined>(undefined);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [hasEverBeenAuthorized, setHasEverBeenAuthorized] = useState(false);

  const displayUserData = (() => {
    if (isImpersonating && impersonatedAccountId && userData) {
      const org = fullOrganizations.find(o => o.id === impersonatedAccountId);
      if (org) {
        return {
          ...userData,
          name: org.name,
          photoUrl: org.branding?.iconUrl || org.logoUrl || userData.photoUrl,
        };
      }
    }
    return userData;
  })();

  useEffect(() => {
    if (userData) {
      setInitialLoadComplete(true);
    }
  }, [userData]);

  useEffect(() => {
    let internalMounted = true;

    const isReadyToCheck = !loading || !!userData;

    if (!isReadyToCheck) {
      return () => {
        internalMounted = false;
      };
    }

    if (userData && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }

    if (!isAuthenticated && !loading) {
      if (!isLoggingOut()) {
        router.push(getPortalPath('/login/'));
      }
      return () => {
        internalMounted = false;
      };
    }

    const markAuthorized = (role?: UserRole) => {
      if (!internalMounted) return;
      setIsAuthorized(true);
      if (role) setMemberRole(role);
      setHasEverBeenAuthorized(true);
    };

    const markDenied = () => {
      if (!internalMounted) return;
      setIsAuthorized(false);
    };

    const checkAccess = async () => {
      try {
        if (!userData) return;

        if (isImpersonating && impersonatedAccountId) {
          markAuthorized(undefined);
          return;
        }

        if (effectiveOrgId) {
          if (userData.isAgency || userData.accountType === 'AGENCY') {
            markAuthorized(userData.agencyRole || 'owner');
            return;
          }

          if (effectiveOrgId === 'template') {
            markAuthorized('owner');
            return;
          }

          const member = await getMemberByUserId(effectiveOrgId, userData.id);
          if (!internalMounted) return;

          if (member) {
            markAuthorized(member.role);
          } else {
            markDenied();
          }
          return;
        }

        if (isAgencyPage) {
          const authorized = Boolean(userData.isAgency) || userData.accountType === 'AGENCY';
          if (authorized) {
            markAuthorized(userData.agencyRole || 'owner');
          } else {
            markDenied();
          }
          return;
        }

        markAuthorized(undefined);
      } catch (error) {
        Logger.error('Error checking access', error);
        markDenied();
      }
    };

    void checkAccess();

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
    hasEverBeenAuthorized,
    initialLoadComplete,
  };
}
