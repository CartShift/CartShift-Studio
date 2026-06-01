'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import {
  createProfitSplitFromPricingRequest,
  deleteProfitSplit,
  finalizeProfitSplit,
  getPaidPricingRequestsForProfitSplits,
  getProfitSplits,
  updateProfitSplit,
} from '@/lib/services/profit-splits';
import { ProfitSplit, UpdateProfitSplitData } from '@/lib/types/profit-split';
import { USER_ROLE } from '@/lib/types/portal';
import { queryKeys } from '@/lib/utils/query-keys';
import { hasPermission, PERMISSIONS } from '@/lib/utils/permissions';

const STALE_TIME = 5 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

export function useCanManageProfitSplits() {
  const { loading, isAgency, userData, isAuthenticated } = usePortalAuth();
  const canManage =
    isAuthenticated &&
    isAgency &&
    hasPermission(userData?.agencyRole ?? USER_ROLE.OWNER, PERMISSIONS.MANAGE_PROFIT_SPLITS);

  return { loading, canManage };
}

export function useProfitSplits() {
  const { loading: authLoading, canManage } = useCanManageProfitSplits();

  const query = useQuery<ProfitSplit[]>({
    queryKey: queryKeys.profitSplits.all,
    queryFn: () => getProfitSplits(),
    enabled: !authLoading && canManage,
    staleTime: STALE_TIME,
  });

  return {
    splits: query.data ?? [],
    loading: authLoading || (canManage && query.isLoading),
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    canManage,
  };
}

export function usePaidPricingRequestsForProfitSplits() {
  const { loading: authLoading, canManage } = useCanManageProfitSplits();

  const query = useQuery({
    queryKey: queryKeys.profitSplits.paidPricingRequests,
    queryFn: getPaidPricingRequestsForProfitSplits,
    enabled: !authLoading && canManage,
    staleTime: STALE_TIME,
  });

  return {
    paidRequests: query.data ?? [],
    loading: authLoading || (canManage && query.isLoading),
    error: query.error instanceof Error ? query.error.message : null,
  };
}

export function useProfitSplitAgencyTeam() {
  const { loading: authLoading, canManage } = useCanManageProfitSplits();

  const query = useQuery({
    queryKey: queryKeys.team.agency,
    queryFn: getAgencyTeam,
    enabled: !authLoading && canManage,
    staleTime: STALE_TIME,
  });

  return {
    agencyTeam: query.data ?? [],
    loading: authLoading || (canManage && query.isLoading),
    error: query.error instanceof Error ? query.error.message : null,
  };
}

export function useProfitSplitMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.profitSplits.toast');

  const invalidateProfitSplits = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.profitSplits.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.profitSplits.paidPricingRequests }),
    ]);
  };

  const createFromPricingRequest = useMutation({
    mutationFn: createProfitSplitFromPricingRequest,
    onSuccess: async () => {
      await invalidateProfitSplits();
      toast.success(t('created'));
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const saveDraft = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProfitSplitData }) =>
      updateProfitSplit(id, data),
    onSuccess: async () => {
      await invalidateProfitSplits();
      toast.success(t('saved'));
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const finalize = useMutation({
    mutationFn: finalizeProfitSplit,
    onSuccess: async () => {
      await invalidateProfitSplits();
      toast.success(t('finalized'));
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: deleteProfitSplit,
    onSuccess: async () => {
      await invalidateProfitSplits();
      toast.success(t('deleted'));
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  return {
    createFromPricingRequest,
    saveDraft,
    finalize,
    remove,
    isMutating:
      createFromPricingRequest.isPending ||
      saveDraft.isPending ||
      finalize.isPending ||
      remove.isPending,
  };
}
