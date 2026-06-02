'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BillingProfile } from '@/lib/types/portal';
import { getBillingProfile, updateBillingProfile } from '@/lib/services/portal-billing';

export const billingProfileKey = ['billing-profile'] as const;

export function useBillingProfile(enabled = true) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: billingProfileKey, queryFn: getBillingProfile, enabled, staleTime: 300000 });
  const update = useMutation({
    mutationFn: (profile: BillingProfile) => updateBillingProfile(profile),
    onSuccess: profile => queryClient.setQueryData(billingProfileKey, profile),
  });
  return { profile: query.data ?? null, loading: query.isLoading, update };
}
