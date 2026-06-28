'use client';

import { useQuery } from '@tanstack/react-query';
import { getFilesByOrg } from '@/lib/services/portal-files';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';

export function useOrgFiles(orgId: string | undefined, options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' && orgId ? orgId : '';
  const enabled = options?.enabled ?? true;
  const shouldFetch = isAuthenticated && !auth && Boolean(safeOrgId) && enabled;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.files.byOrg(safeOrgId),
    queryFn: () => getFilesByOrg(safeOrgId),
    enabled: shouldFetch,
    staleTime: 60 * 1000,
  });

  return {
    files: data ?? [],
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
