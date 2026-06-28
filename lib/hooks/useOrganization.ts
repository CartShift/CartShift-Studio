'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganization, subscribeToOrganization } from '@/lib/services/portal-organizations';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';
import type { Organization } from '@/lib/types/portal';

export function useOrganization(orgId: string | undefined, options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' && orgId ? orgId : '';
  const enabled = options?.enabled ?? true;
  const shouldFetch = isAuthenticated && !auth && Boolean(safeOrgId) && enabled;

  const {
    data: organization = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.organizations.detail(safeOrgId),
    queryFn: () => getOrganization(safeOrgId),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribeOrg = useMemo(
    () =>
      shouldFetch
        ? (cb: (data: Organization | null) => void) => subscribeToOrganization(safeOrgId, cb)
        : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(
    queryKeys.organizations.detail(safeOrgId),
    subscribeOrg,
    shouldFetch
  );

  return {
    organization,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch,
  };
}
