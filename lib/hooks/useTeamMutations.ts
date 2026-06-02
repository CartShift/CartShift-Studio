import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelInvite, removeMember, updateMemberRole } from '@/lib/services/portal-organizations';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types/portal';
import { invalidatePortalTeamData } from '@/lib/utils/portal-cache-invalidation';

export function useTeamMutations(orgId?: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal.team');

  const invalidateTeam = () => {
    invalidatePortalTeamData(queryClient, orgId);
  };

  const cancelInviteMutation = useMutation({
    mutationFn: cancelInvite,
    onSuccess: () => {
      toast.success(t('success.cancelInvite' as Parameters<typeof t>[0]));
      invalidateTeam();
    },
    onError: error => {
      console.error('Failed to cancel invite:', error);
      toast.error(t('errors.cancelInvite'));
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({
      memberId,
      orgId: memberOrgId,
      userId,
    }: {
      memberId: string;
      orgId: string;
      userId: string;
    }) => removeMember(memberId, memberOrgId, userId),
    onSuccess: () => {
      toast.success(t('success.removeMember' as Parameters<typeof t>[0]));
      invalidateTeam();
    },
    onError: error => {
      console.error('Failed to remove member:', error);
      toast.error(t('errors.load'));
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: UserRole }) =>
      updateMemberRole(memberId, role),
    onSuccess: () => {
      toast.success(t('success.updateRole' as Parameters<typeof t>[0]));
      invalidateTeam();
    },
    onError: error => {
      console.error('Failed to update member role:', error);
      toast.error(t('errors.load'));
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
    isUpdatingRole: updateRoleMutation.isPending,
  };
}
