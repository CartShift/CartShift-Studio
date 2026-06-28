'use client';

import { useQuery } from '@tanstack/react-query';
import { getAgency } from '@/lib/services/portal-agency';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';

export function useAgencyProfile() {
  const { user, loading: auth, isAuthenticated } = usePortalAuth();
  const agencyId = user?.uid ?? '';
  const shouldFetch = isAuthenticated && !auth && Boolean(agencyId);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.agency.profile(agencyId),
    queryFn: () => getAgency(agencyId),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
  });

  return {
    agency: data ?? null,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
