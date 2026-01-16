'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { getRequestsByOrg, getAllRequests } from '@/lib/services/portal-requests';

export function useRequests() {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();

  const shouldFetch =
    isAuthenticated && !auth && (isAgency || (orgId && typeof orgId === 'string'));

  const {
    data: requests = [],
    is,
    error,
    refetch,
  } = useQuery({
    queryKey: isAgency ? ['all-requests'] : ['org-requests', orgId],
    queryFn: async () => {
      if (isAgency) {
        return getAllRequests();
      } else {
        return getRequestsByOrg(orgId as string);
      }
    },
    enabled: Boolean(shouldFetch),
    refetchInterval: 10000, // Refresh every 10s for lists
    staleTime: 60 * 1000, // 1 minute stale time
  });

  const loading = auth || (shouldFetch && is);
  const errorMsg = error instanceof Error ? error.message : (error as string | null);

  return {
    requests,
    loading,
    error: errorMsg,
    refetch,
  };
}
