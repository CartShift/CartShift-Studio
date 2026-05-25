'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getMarketingDashboardData } from '@/lib/services/portal-marketing';
import { queryKeys } from '@/lib/utils/query-keys';

const STALE_TIME = 60 * 1000;

export function useMarketingDashboard() {
  const { loading: auth, isAgency } = usePortalAuth();
  const shouldFetch = !auth && isAgency;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.marketing.dashboard,
    queryFn: getMarketingDashboardData,
    enabled: Boolean(shouldFetch),
    staleTime: STALE_TIME,
  });

  return {
    dashboard: data,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
