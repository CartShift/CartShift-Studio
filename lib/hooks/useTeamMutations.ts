import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelInvite, removeMember, updateMemberRole } from '@/lib/services/portal-organizations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types/portal';

export function useTeamMutations() {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.team');

  const cancelInviteMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      toast.success(t('success.cancelInvite' as any));
      queryClient.invalidateQueries({ queryKey: ['org-invites'] });
    },
    onError: error => {
      console.error('Failed to cancel invite:', error);
      toast.error(t('errors.cancelInvite'));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({
      memberId,
      orgId,
      userId,
    }: {
      memberId: string;
      orgId: string;
      userId: string;
    }) => removeMember(memberId, orgId, userId),
    onSuccess: () => {
      toast.success(t('success.removeMember' as any));
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
    },
    onError: error => {
      console.error('Failed to remove member:', error);
      toast.error(t('errors.load')); // Generic error
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: UserRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      toast.success(t('success.updateRole' as any));
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
    },
    onError: error => {
      console.error('Failed to update member role:', error);
      toast.error(t('errors.load')); // Generic error
    },
  });

  return {
    cancelInviteMutation,
    cancelInvite: cancelInviteMutation.mutate,
    isCancellingInvite: cancelInviteMutation.isPending,

    removeMemberMutation,
    removeMember: removeMemberMutation.mutate,
    isRemovingMember: removeMemberMutation.isPending,

    updateRoleMutation,
    updateMemberRole: updateRoleMutation.mutate,
    isRole: updateRoleMutation.isPending,
  };
}
