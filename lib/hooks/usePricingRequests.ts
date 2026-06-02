'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import {
  getPricingRequestsByOrg,
  getAllPricingRequests,
  subscribeToOrgPricingRequests,
  subscribeToAllPricingRequests,
} from '@/lib/services/pricing-requests';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import { PricingRequest, PRICING_STATUS } from '@/lib/types/pricing';

type OrgPricingOptions = {
  excludeDrafts?: boolean;
};

export function useOrgPricingRequests(options: OrgPricingOptions = {}) {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' ? orgId : '';
  const { excludeDrafts = false } = options;

  const shouldFetch = isAuthenticated && !auth && Boolean(safeOrgId);
  const qKey = queryKeys.pricing.byOrg;

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: qKey,
    queryFn: async () => {
      const data = await getPricingRequestsByOrg(safeOrgId);
      if (excludeDrafts) {
        return data.filter(request => request.status !== PRICING_STATUS.DRAFT);
      }
      return data;
    },
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  const subscribe = useMemo(() => {
    if (!shouldFetch) return null;
    return (cb: (data: PricingRequest[]) => void) =>
      subscribeToOrgPricingRequests(safeOrgId, cb, { excludeDrafts });
  }, [shouldFetch, safeOrgId, excludeDrafts]);

  useFirestoreSubscription(qKey, subscribe, Boolean(shouldFetch));

  return {
    requests,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}

export function useAllPricingRequests() {
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();
  const shouldFetch = isAuthenticated && !auth && isAgency;
  const qKey = queryKeys.pricing.allRequests;

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: qKey,
    queryFn: () => getAllPricingRequests(),
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  const subscribe = useMemo(() => {
    if (!shouldFetch) return null;
    return (cb: (data: PricingRequest[]) => void) => subscribeToAllPricingRequests(cb);
  }, [shouldFetch]);

  useFirestoreSubscription(qKey, subscribe, Boolean(shouldFetch));

  return {
    requests,
    loading: auth || (shouldFetch && isLoading),
    error: error instanceof Error ? error.message : (error as string | null),
    refetch,
  };
}
