import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPricingRequest,
  sendPricingRequest,
  acceptPricingRequest,
  declinePricingRequest,
  cancelPricingRequest,
} from '@/lib/services/pricing-requests';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CreatePricingRequestData } from '@/lib/types/pricing';

export function usePricingMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.pricing');

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
      queryClient.invalidateQueries({ queryKey: ['org-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['portal-requests'] });
      return pricingOffer;
    },
    onError: error => {
      console.error('Failed to create pricing request:', error);
      toast.error(t('form.errors.generic' as any)); // Generic error
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendPricingRequest,
    onSuccess: () => {
      toast.success(t('form.sendSuccess' as any));
      queryClient.invalidateQueries({ queryKey: ['org-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-pricing-requests'] });
    },
    onError: error => {
      console.error('Failed to send pricing request:', error);
      toast.error(t('form.sendFailed' as any));
    },
  });

  const acceptMutation = useMutation({
    mutationFn: ({ requestId, clientNotes }: { requestId: string; clientNotes?: string }) =>
      acceptPricingRequest(requestId, clientNotes),
    onSuccess: () => {
      toast.success(t('form.acceptSuccess' as any));
      queryClient.invalidateQueries({ queryKey: ['org-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['portal-requests'] });
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
      queryClient.invalidateQueries({ queryKey: ['org-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-pricing-requests'] });
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
      queryClient.invalidateQueries({ queryKey: ['org-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-pricing-requests'] });
      queryClient.invalidateQueries({ queryKey: ['portal-requests'] });
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
