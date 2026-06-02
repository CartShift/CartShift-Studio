'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/utils/query-keys';
import { getPaymentsForRequest, recordManualPayment, recordPayPalPayment } from '@/lib/services/portal-billing';
import { PaymentMethod } from '@/lib/types/portal';

export function useRequestPayments(requestId: string, enabled = true) {
  const queryClient = useQueryClient();
  const key = queryKeys.requests.payments(requestId);
  const query = useQuery({ queryKey: key, queryFn: () => getPaymentsForRequest(requestId), enabled: Boolean(requestId && enabled) });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(requestId) });
  };
  const manual = useMutation({
    mutationFn: (input: { amount: number; method: Exclude<PaymentMethod, 'manual'>; reference?: string; notes?: string; paidAt?: string }) => recordManualPayment(requestId, input),
    onSuccess: invalidate,
  });
  const paypal = useMutation({ mutationFn: (orderId: string) => recordPayPalPayment(requestId, orderId), onSuccess: invalidate });
  return { payments: query.data ?? [], loading: query.isLoading, manual, paypal };
}
