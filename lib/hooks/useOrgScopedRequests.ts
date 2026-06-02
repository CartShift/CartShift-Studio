'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRequestsByOrg, subscribeToOrgRequests } from '@/lib/services/portal-requests';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';
import type { Request } from '@/lib/types/portal';

export function useOrgScopedRequests(orgId: string | undefined, options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' && orgId ? orgId : '';
  const enabled = options?.enabled ?? true;
  const shouldFetch = isAuthenticated && !auth && Boolean(safeOrgId) && enabled;

  const {
    data: requests = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.requests.byOrg(safeOrgId),
    queryFn: () => getRequestsByOrg(safeOrgId),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribeRequests = useMemo(
    () =>
      shouldFetch
        ? (cb: (data: Request[]) => void) => subscribeToOrgRequests(safeOrgId, cb)
        : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(queryKeys.requests.byOrg(safeOrgId), subscribeRequests, shouldFetch);

  return {
    requests,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
