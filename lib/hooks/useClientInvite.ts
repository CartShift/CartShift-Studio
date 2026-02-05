'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { inviteClient, cancelInvite } from '@/lib/services/portal-organizations';

interface UseClientInviteOptions {
  orgId: string;
  onSuccess?: (inviteCode: string) => void;
}

export function useClientInvite({ orgId, onSuccess }: UseClientInviteOptions) {
  const queryClient = useQueryClient();
  const t = useTranslations();

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
      queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] });
      toast.success(t('portal.clientInvite.success'));
      onSuccess?.(invite.code);
    },
    onError: (error: Error) => {
      toast.error(error.message || t('portal.clientInvite.errors.generic'));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-invites', orgId] });
      toast.success(t('portal.team.inviteCanceled'));
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
