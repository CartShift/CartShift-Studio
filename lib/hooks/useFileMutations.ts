'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { deleteFile } from '@/lib/services/portal-files';
import { portalToast as toast } from '@/lib/utils/portal-toast';
import { queryKeys } from '@/lib/utils/query-keys';

export function useFileMutations(orgId?: string) {
  const queryClient = useQueryClient();
  const tToast = useTranslations('portal.toast');

  const deleteMutation = useMutation({
    mutationFn: ({ fileId, storagePath }: { fileId: string; storagePath: string }) =>
      deleteFile(fileId, storagePath),
    onSuccess: () => {
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.files.byOrg(orgId) });
      }
      toast.success(tToast('fileDeleted'), tToast('fileDeletedDesc'));
    },
    onError: () => {
      toast.error(tToast('fileDeleteFailed'), tToast('fileDeleteFailedDesc'));
    },
  });

  return {
    deleteFile: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
