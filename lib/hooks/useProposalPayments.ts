'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  cancelProposalInstallment,
  createProposalInstallment,
  getProposalPayments,
  issueProposalPublicToken,
  recordManualProposalPayment,
} from '@/lib/services/proposal-api';
import { ManualPaymentMethod } from '@/lib/types/pricing';
import { queryKeys } from '@/lib/utils/query-keys';

export function useProposalPayments(pricingId: string, enabled: boolean) {
  const t = useTranslations('portal.pricing.proposalPayments');
  const queryClient = useQueryClient();
  const queryKey = queryKeys.requests.commercialPayments(pricingId);
  const paymentsQuery = useQuery({
    queryKey,
    queryFn: () => getProposalPayments(pricingId),
    enabled: Boolean(pricingId && enabled),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(pricingId) });
  };

  const issueLink = useMutation({
    mutationFn: () => issueProposalPublicToken(pricingId),
    onError: error => toast.error(error instanceof Error ? error.message : t('linkFailed')),
  });
  const createInstallment = useMutation({
    mutationFn: (input: { label: string; amount: number; dueAt?: string }) =>
      createProposalInstallment(pricingId, input),
    onSuccess: () => {
      toast.success(t('created'));
      invalidate();
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : t('createFailed')),
  });
  const cancelInstallment = useMutation({
    mutationFn: (paymentId: string) => cancelProposalInstallment(pricingId, paymentId),
    onSuccess: () => {
      toast.success(t('canceled'));
      invalidate();
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : t('cancelFailed')),
  });
  const recordManualPayment = useMutation({
    mutationFn: (input: {
      label: string;
      amount: number;
      method: ManualPaymentMethod;
      reference?: string;
      note?: string;
    }) => recordManualProposalPayment(pricingId, input),
    onSuccess: () => {
      toast.success(t('manualRecorded'));
      invalidate();
    },
    onError: error =>
      toast.error(error instanceof Error ? error.message : t('manualFailed')),
  });

  return {
    payments: paymentsQuery.data || [],
    loading: paymentsQuery.isLoading,
    issueLink,
    createInstallment,
    cancelInstallment,
    recordManualPayment,
  };
}
