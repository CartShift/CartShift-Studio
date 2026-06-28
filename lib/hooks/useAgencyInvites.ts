'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscribeToAgencyInvites } from '@/lib/services/portal-organizations';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';
import type { Invite } from '@/lib/types/portal';

async function fetchAgencyInvites(): Promise<Invite[]> {
  return new Promise<Invite[]>(resolve => {
    let settled = false;
    const unsubscribe = subscribeToAgencyInvites(data => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve(data);
      }
    });
    setTimeout(() => {
      if (!settled) {
        settled = true;
        unsubscribe();
        resolve([]);
      }
    }, 5000);
  });
}

export function useAgencyInvites(options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();
  const enabled = options?.enabled ?? true;
  const shouldFetch = isAuthenticated && !auth && isAgency && enabled;

  const { data = [], isLoading, error } = useQuery({
    queryKey: queryKeys.invites.agency,
    queryFn: fetchAgencyInvites,
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribe = useMemo(
    () => (shouldFetch ? (cb: (data: Invite[]) => void) => subscribeToAgencyInvites(cb) : null),
    [shouldFetch]
  );
  useFirestoreSubscription(queryKeys.invites.agency, subscribe, shouldFetch);

  return {
    invites: data,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
