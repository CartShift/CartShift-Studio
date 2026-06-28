'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useTranslations } from 'next-intl';
import { getRequestsByOrg, subscribeToOrgRequests } from '@/lib/services/portal-requests';
import { getOrgActivities, subscribeToOrgActivities } from '@/lib/services/portal-activities';
import { getMemberByUserId, ensureMembership } from '@/lib/services/portal-organizations';
import { portalToast } from '@/lib/utils/portal-toast';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import { Request, ActivityLog } from '@/lib/types/portal';

export function useDashboardData() {
  const orgId = useResolvedOrgId();
  const { userData, loading: auth, isAuthenticated } = usePortalAuth();
  const router = useRouter();
  const t = useTranslations('portal.dashboard.toast');
  const mountedRef = useRef(false);

  const [membershipChecked, setMembershipChecked] = useState(false);
  const [membershipError, setMembershipError] = useState<string | null>(null);

  const isAgency = userData?.isAgency || false;
  const safeOrgId = typeof orgId === 'string' ? orgId : '';
  const shouldFetchData = isAuthenticated && safeOrgId && (isAgency || membershipChecked);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!safeOrgId || auth || !userData || isAgency || membershipChecked || !mountedRef.current)
      return;

    const verifyMembership = async () => {
      try {
        let member = await getMemberByUserId(safeOrgId, userData.id);
        if (!member) {
          try {
            member = await ensureMembership(safeOrgId, userData.id, userData.email, userData.name);
          } catch (err) {
            console.error('Failed to ensure membership:', err);
          }
        }
        if (!mountedRef.current) return;
        if (member) {
          setMembershipChecked(true);
          setMembershipError(null);
        } else {
          setMembershipError('access_denied');
        }
      } catch {
        if (mountedRef.current) setMembershipError('membership_check_failed');
      }
    };
    verifyMembership();
  }, [safeOrgId, userData, auth, isAgency, membershipChecked]);

  // 1. Requests (initial fetch + real-time)
  const {
    data: requests = [],
    isLoading: isLoadingRequests,
    error: requestsError,
  } = useQuery({
    queryKey: queryKeys.requests.byOrg(safeOrgId),
    queryFn: () => getRequestsByOrg(safeOrgId),
    enabled: Boolean(shouldFetchData),
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Permission denied')) {
        portalToast.error(t('accessDenied'), t('accessDeniedDesc'));
        setTimeout(() => router.push(getPortalPath('/dashboard/')), 2000);
        return false;
      }
      return failureCount < 2;
    },
  });

  const subscribeRequests = useMemo(
    () =>
      shouldFetchData
        ? (cb: (data: Request[]) => void) => subscribeToOrgRequests(safeOrgId, cb)
        : null,
    [shouldFetchData, safeOrgId]
  );
  useFirestoreSubscription(
    queryKeys.requests.byOrg(safeOrgId),
    subscribeRequests,
    Boolean(shouldFetchData)
  );

  // 2. Activities (initial fetch + real-time)
  const {
    data: activities = [],
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: queryKeys.activities.byOrg(safeOrgId),
    queryFn: () => getOrgActivities(safeOrgId),
    enabled: Boolean(shouldFetchData),
    staleTime: Infinity,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('Permission denied')) return false;
      return failureCount < 2;
    },
  });

  const subscribeActivities = useMemo(
    () =>
      shouldFetchData
        ? (cb: (data: ActivityLog[]) => void) => subscribeToOrgActivities(safeOrgId, cb)
        : null,
    [shouldFetchData, safeOrgId]
  );
  useFirestoreSubscription(
    queryKeys.activities.byOrg(safeOrgId),
    subscribeActivities,
    Boolean(shouldFetchData)
  );

  return {
    requests,
    activities,
    loading:
      auth ||
      (shouldFetchData && (isLoadingRequests || isLoadingActivities)) ||
      (!isAgency && !membershipChecked && !membershipError),
    error:
      membershipError ||
      (requestsError instanceof Error ? requestsError.message : null) ||
      (activitiesError instanceof Error ? activitiesError.message : null),
    userData,
    orgId,
  };
}
