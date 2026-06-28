'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { deleteRequest, updateRequestStatus } from '@/lib/services/portal-requests';
import { portalToast as toast } from '@/lib/utils/portal-toast';
import { invalidatePortalRequestData } from '@/lib/utils/portal-cache-invalidation';
import type { RequestStatus } from '@/lib/types/portal';

export function useRequestListMutations(orgId?: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal');
  const tToast = useTranslations('portal.toast');

  const deleteMutation = useMutation({
    mutationFn: ({ requestId }: { requestId: string; orgId?: string }) => deleteRequest(requestId),
    onSuccess: (_data, { requestId, orgId: reqOrgId }) => {
      invalidatePortalRequestData(queryClient, { orgId: reqOrgId ?? orgId, requestId });
      toast.success(t('common.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('common.deleteError'));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: RequestStatus }) =>
      updateRequestStatus(requestId, status),
    onSuccess: (_data, { requestId }) => {
      invalidatePortalRequestData(queryClient, { orgId, requestId });
    },
    onError: () => {
      toast.error(tToast('statusUpdateFailed'));
    },
  });

  return {
    deleteRequest: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateStatus: statusMutation.mutateAsync,
    isUpdatingStatus: statusMutation.isPending,
  };
}
