'use client';

import { useQuery } from '@tanstack/react-query';
import { getPricingRequest } from '@/lib/services/pricing-requests';
import { queryKeys } from '@/lib/utils/query-keys';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getClientVisibleRequest } from '@/lib/services/client-requests-api';
import type { PricingRequest } from '@/lib/types/pricing';

export function usePricingRequest(pricingId: string | null) {
  const { isAgency, loading } = usePortalAuth();
  return useQuery({
    queryKey: queryKeys.requests.byRoleDetail(pricingId || '', isAgency ? 'agency' : 'client'),
    queryFn: async () => isAgency ? getPricingRequest(pricingId!) :
      await getClientVisibleRequest(pricingId!) as PricingRequest | null,
    enabled: Boolean(pricingId) && !loading,
    staleTime: isAgency ? Infinity : 15_000,
    refetchInterval: isAgency ? false : 30_000,
  });
}
