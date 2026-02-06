'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import {
  getRequestsByOrg,
  getAllRequests,
  subscribeToOrgRequests,
  subscribeToAllRequests,
} from '@/lib/services/portal-requests';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import { Request } from '@/lib/types/portal';

export function useRequests() {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' ? orgId : '';

  const shouldFetch = isAuthenticated && !auth && (isAgency || Boolean(safeOrgId));
  const qKey = isAgency ? queryKeys.requests.all : queryKeys.requests.byOrg(safeOrgId);

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: qKey,
    queryFn: () => (isAgency ? getAllRequests() : getRequestsByOrg(safeOrgId)),
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  // Real-time subscription replaces polling
  const subscribe = useMemo(() => {
    if (!shouldFetch) return null;
    return isAgency
      ? (cb: (data: Request[]) => void) => subscribeToAllRequests(cb)
      : (cb: (data: Request[]) => void) => subscribeToOrgRequests(safeOrgId, cb);
  }, [shouldFetch, isAgency, safeOrgId]);

  useFirestoreSubscription(qKey, subscribe, Boolean(shouldFetch));

  return {
    requests,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}
