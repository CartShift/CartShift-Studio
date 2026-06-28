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

export interface UseRequestsOptions {
  /** Explicit org scope — skips agency-wide mode */
  orgId?: string;
  enabled?: boolean;
}

export function useRequests(options?: UseRequestsOptions) {
  const resolvedOrgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();

  const explicitOrgId = options?.orgId;
  const orgScoped = explicitOrgId !== undefined;
  const safeOrgId =
    typeof explicitOrgId === 'string'
      ? explicitOrgId
      : typeof resolvedOrgId === 'string'
        ? resolvedOrgId
        : '';

  const enabled = options?.enabled ?? true;
  const agencyMode = isAgency && !orgScoped;
  const shouldFetch =
    isAuthenticated && !auth && enabled && (agencyMode || Boolean(safeOrgId));

  const qKey = agencyMode ? queryKeys.requests.all : queryKeys.requests.byOrg(safeOrgId);

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: qKey,
    queryFn: () => (agencyMode ? getAllRequests() : getRequestsByOrg(safeOrgId)),
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  const subscribe = useMemo(() => {
    if (!shouldFetch) return null;
    return agencyMode
      ? (cb: (data: Request[]) => void) => subscribeToAllRequests(cb)
      : (cb: (data: Request[]) => void) => subscribeToOrgRequests(safeOrgId, cb);
  }, [shouldFetch, agencyMode, safeOrgId]);

  useFirestoreSubscription(qKey, subscribe, Boolean(shouldFetch));

  return {
    requests,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
