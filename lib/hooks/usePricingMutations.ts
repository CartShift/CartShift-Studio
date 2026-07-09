import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPricingRequest,
  updatePricingRequest,
  sendPricingRequest,
  acceptPricingRequest,
  declinePricingRequest,
  cancelPricingRequest,
  deletePricingRequest,
} from '@/lib/services/pricing-requests';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreatePricingRequestData, UpdatePricingRequestData } from '@/lib/types/pricing';
import { invalidatePortalPricingData } from '@/lib/utils/portal-cache-invalidation';

export function usePricingMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.pricing');

  const invalidatePricing = (options?: { pricingId?: string; orgId?: string; requestId?: string }) => {
    invalidatePortalPricingData(queryClient, options);
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
      toast.success(t('form.createSuccess'));
      invalidatePricing({ orgId: pricingOffer.orgId, pricingId: pricingOffer.id });
      return pricingOffer;
    },
    onError: error => {
      console.error('Failed to create pricing request:', error);
      toast.error(t('form.errors.generic'));
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendPricingRequest,
    onSuccess: (_result, requestId) => {
      toast.success(t('form.sendSuccess'));
      invalidatePricing({ pricingId: requestId });
    },
    onError: error => {
      console.error('Failed to send pricing request:', error);
      toast.error(t('form.sendFailed'));
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
      toast.success(t('form.updateSuccess'));
      invalidatePricing({ pricingId: requestId });
    },
    onError: error => {
      console.error('Failed to update pricing request:', error);
      toast.error(t('form.errors.generic'));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: ({ requestId, clientNotes }: { requestId: string; clientNotes?: string }) =>
      acceptPricingRequest(requestId, clientNotes),
    onSuccess: () => {
      toast.success(t('form.acceptSuccess'));
      invalidatePricing();
    },
    onError: error => {
      console.error('Failed to accept pricing request:', error);
      toast.error(t('form.sendFailed'));
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      declinePricingRequest(requestId, reason),
    onSuccess: (_result, { requestId }) => {
      toast.success(t('form.declineSuccess'));
      invalidatePricing({ pricingId: requestId });
    },
    onError: error => {
      console.error('Failed to decline pricing request:', error);
      toast.error(t('form.sendFailed'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPricingRequest,
    onSuccess: (_result, requestId) => {
      toast.success(t('form.cancelSuccess'));
      invalidatePricing({ pricingId: requestId });
    },
    onError: error => {
      console.error('Failed to cancel pricing request:', error);
      toast.error(t('form.deleteFailed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePricingRequest,
    onSuccess: (_result, requestId) => {
      toast.success(t('form.cancelSuccess'));
      invalidatePricing({ pricingId: requestId });
    },
    onError: error => {
      console.error('Failed to delete pricing request:', error);
      toast.error(t('form.deleteFailed'));
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
    deleteMutation,
    deletePricingRequest: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
