'use client';

import { useQuery } from '@tanstack/react-query';
import { getPricingRequest } from '@/lib/services/pricing-requests';
import { queryKeys } from '@/lib/utils/query-keys';

export function usePricingRequest(pricingId: string | null) {
  return useQuery({
    queryKey: queryKeys.requests.detail(pricingId || ''),
    queryFn: () => getPricingRequest(pricingId!),
    enabled: Boolean(pricingId),
  });
}
