'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscribeToServices } from '@/lib/services/portal-services';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';
import type { Service } from '@/lib/types/portal';

async function fetchServices(): Promise<Service[]> {
  return new Promise<Service[]>(resolve => {
    let settled = false;
    const unsubscribe = subscribeToServices(data => {
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

export function useAgencyServices(options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();
  const enabled = options?.enabled ?? true;
  const shouldFetch = isAuthenticated && !auth && isAgency && enabled;

  const { data = [], isLoading, error } = useQuery({
    queryKey: queryKeys.services.agency,
    queryFn: fetchServices,
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribe = useMemo(
    () => (shouldFetch ? (cb: (data: Service[]) => void) => subscribeToServices(cb) : null),
    [shouldFetch]
  );
  useFirestoreSubscription(queryKeys.services.agency, subscribe, shouldFetch);

  return {
    services: data,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : error ? String(error) : null,
  };
}
