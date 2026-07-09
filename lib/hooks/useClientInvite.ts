'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usePortalTranslations } from '@/lib/i18n/translations';
import { inviteClient, cancelInvite } from '@/lib/services/portal-organizations';
import { queryKeys } from '@/lib/utils/query-keys';

interface UseClientInviteOptions {
  orgId: string;
  onSuccess?: (inviteCode: string) => void;
}

export function useClientInvite({ orgId, onSuccess }: UseClientInviteOptions) {
  const queryClient = useQueryClient();
  const t = usePortalTranslations();

  const inviteMutation = useMutation({
    mutationFn: async ({
      email,
      invitedBy,
      invitedByName,
      requestIds,
    }: {
      email: string;
      invitedBy: string;
      invitedByName: string;
      requestIds?: string[];
    }) => {
      return inviteClient(orgId, email, invitedBy, invitedByName, requestIds);
    },
    onSuccess: invite => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.byOrg(orgId) });
      toast.success(t('clientInvite.success'));
      onSuccess?.(invite.code);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('clientInvite.errors.generic'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.byOrg(orgId) });
      toast.success(t('team.inviteCanceled'));
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel invitation');
    },
  });

  return {
    inviteClient: inviteMutation.mutate,
    cancelInvite: cancelMutation.mutate,
    isInviting: inviteMutation.isPending,
    isCanceling: cancelMutation.isPending,
  };
}
