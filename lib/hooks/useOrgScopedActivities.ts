'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrgActivities, subscribeToOrgActivities } from '@/lib/services/portal-activities';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';
import type { ActivityLog } from '@/lib/types/portal';

export function useOrgScopedActivities(orgId: string | undefined, options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' && orgId ? orgId : '';
  const enabled = options?.enabled ?? true;
  const shouldFetch = isAuthenticated && !auth && Boolean(safeOrgId) && enabled;

  const {
    data: activities = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.activities.byOrg(safeOrgId),
    queryFn: () => getOrgActivities(safeOrgId),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribeActivities = useMemo(
    () =>
      shouldFetch
        ? (cb: (data: ActivityLog[]) => void) => subscribeToOrgActivities(safeOrgId, cb)
        : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(
    queryKeys.activities.byOrg(safeOrgId),
    subscribeActivities,
    shouldFetch
  );

  return {
    activities,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
