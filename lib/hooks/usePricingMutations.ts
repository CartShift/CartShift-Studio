import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPricingRequest,
  updatePricingRequest,
  sendPricingRequest,
  acceptPricingRequest,
  declinePricingRequest,
  cancelPricingRequest,
} from '@/lib/services/pricing-requests';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreatePricingRequestData, UpdatePricingRequestData } from '@/lib/types/pricing';
import { queryKeys } from '@/lib/utils/query-keys';

export function usePricingMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.pricing');

  const invalidatePricing = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pricing.byOrg });
    queryClient.invalidateQueries({ queryKey: queryKeys.pricing.allRequests });
  };

  const createMutation = useMutation({
    mutationFn: ({
      orgId,
      userId,
      userName,
      data,
    }: {
      orgId: string;
      userId: string;
      userName: string;
      data: CreatePricingRequestData;
    }) => createPricingRequest(orgId, userId, userName, data),
    onSuccess: pricingOffer => {
      toast.success(t('form.createSuccess' as any));
      invalidatePricing();
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.portal });
      return pricingOffer;
    },
    onError: error => {
      console.error('Failed to create pricing request:', error);
      toast.error(t('form.errors.generic' as any));
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendPricingRequest,
    onSuccess: (_result, requestId) => {
      toast.success(t('form.sendSuccess' as any));
      invalidatePricing();
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.detail(requestId) });
    },
    onError: error => {
      console.error('Failed to send pricing request:', error);
      toast.error(t('form.sendFailed' as any));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      requestId,
      data,
    }: {
      requestId: string;
      data: UpdatePricingRequestData;
    }) => updatePricingRequest(requestId, data),
    onSuccess: (_result, { requestId }) => {
      toast.success(t('form.updateSuccess' as any));
      invalidatePricing();
      queryClient.invalidateQueries({ queryKey: queryKeys.pricing.detail(requestId) });
    },
    onError: error => {
      console.error('Failed to update pricing request:', error);
      toast.error(t('form.errors.generic' as any));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: ({ requestId, clientNotes }: { requestId: string; clientNotes?: string }) =>
      acceptPricingRequest(requestId, clientNotes),
    onSuccess: () => {
      toast.success(t('form.acceptSuccess' as any));
      invalidatePricing();
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.portal });
    },
    onError: error => {
      console.error('Failed to accept pricing request:', error);
      toast.error(t('form.sendFailed' as any));
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      declinePricingRequest(requestId, reason),
    onSuccess: () => {
      toast.success(t('form.declineSuccess' as any));
      invalidatePricing();
    },
    onError: error => {
      console.error('Failed to decline pricing request:', error);
      toast.error(t('form.sendFailed' as any));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPricingRequest,
    onSuccess: () => {
      toast.success(t('form.cancelSuccess' as any));
      invalidatePricing();
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.portal });
    },
    onError: error => {
      console.error('Failed to cancel pricing request:', error);
      toast.error(t('form.deleteFailed' as any));
    },
  });

  return {
    createMutation,
    createPricingRequest: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateMutation,
    updatePricingRequest: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    sendMutation,
    sendPricingRequest: sendMutation.mutateAsync,
    isSending: sendMutation.isPending,
    acceptMutation,
    acceptPricingRequest: acceptMutation.mutateAsync,
    isAccepting: acceptMutation.isPending,
    declineMutation,
    declinePricingRequest: declineMutation.mutateAsync,
    isDeclining: declineMutation.isPending,
    cancelMutation,
    cancelPricingRequest: cancelMutation.mutateAsync,
    isCanceling: cancelMutation.isPending,
  };
}
