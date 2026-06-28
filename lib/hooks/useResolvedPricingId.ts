'use client';

import { useParams } from 'next/navigation';

/**
 * Hook to get the pricing ID from URL params.
 */
export function useResolvedPricingId(): string | null {
  const params = useParams();
  const pricingId = params?.pricingId ?? params?.requestId;
  return typeof pricingId === 'string' ? pricingId : null;
}
