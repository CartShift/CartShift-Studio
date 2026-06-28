'use client';

import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { deleteOrganization } from '@/lib/services/portal-organizations';
import { repairAgencyAccount } from '@/lib/services/portal-users';
import { portalToast as toast } from '@/lib/utils/portal-toast';

export function useAgencyClientMutations() {
  const t = useTranslations('portal');

  const deleteClientMutation = useMutation({
    mutationFn: deleteOrganization,
  });

  const repairAccountMutation = useMutation({
    mutationFn: repairAgencyAccount,
    onError: () => toast.error(t('agency.repairFailed')),
  });

  return {
    deleteClient: deleteClientMutation.mutateAsync,
    isDeletingClient: deleteClientMutation.isPending,
    repairAccount: repairAccountMutation.mutateAsync,
    isRepairingAccount: repairAccountMutation.isPending,
  };
}
