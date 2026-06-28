'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { updateOrganization } from '@/lib/services/portal-organizations';
import { updatePortalUser } from '@/lib/services/portal-users';
import {
  uploadUserProfilePicture,
  deleteUserProfilePicture,
  uploadOrganizationLogo,
  deleteOrganizationLogo,
  regenerateOrganizationLogoUrl,
} from '@/lib/services/portal-uploads';
import { resetPassword } from '@/lib/services/auth';
import { portalToast as toast } from '@/lib/utils/portal-toast';
import { queryKeys } from '@/lib/utils/query-keys';
import type { Organization } from '@/lib/types/portal';

export function useWorkspaceSettingsMutations(orgId?: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal');
  const tToast = useTranslations('portal.toast');

  const invalidateOrg = () => {
    if (orgId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.detail(orgId) });
    }
  };

  const updateOrgMutation = useMutation({
    mutationFn: ({
      data,
      silent: _silent,
    }: {
      data: Partial<Organization>;
      silent?: boolean;
    }) => {
      if (!orgId) throw new Error('Organization ID required');
      return updateOrganization(orgId, data);
    },
    onSuccess: (_data, { silent }) => {
      invalidateOrg();
      if (!silent) toast.success(t('settings.general.success'));
    },
    onError: (_error, { silent }) => {
      if (!silent) toast.error(tToast('settingsSaveFailed'));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      data,
      silent: _silent,
    }: {
      userId: string;
      data: Parameters<typeof updatePortalUser>[1];
      silent?: boolean;
    }) => updatePortalUser(userId, data),
    onSuccess: (_data, { silent }) => {
      if (!silent) toast.success(tToast('profileUpdated'));
    },
    onError: (_error, { silent }) => {
      if (!silent) toast.error(tToast('profileUpdateFailed'));
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      uploadUserProfilePicture(userId, file),
    onSuccess: () => toast.success(tToast('avatarUpdated')),
    onError: () => toast.error(tToast('avatarUpdateFailed')),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: ({ userId, photoUrl }: { userId: string; photoUrl: string }) =>
      deleteUserProfilePicture(userId, photoUrl),
    onSuccess: () => toast.success(tToast('avatarRemoved')),
    onError: () => toast.error(tToast('avatarUpdateFailed')),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: ({ orgId: id, file }: { orgId: string; file: File }) =>
      uploadOrganizationLogo(id, file),
    onSuccess: () => {
      invalidateOrg();
      toast.success(tToast('logoUpdated'));
    },
    onError: () => toast.error(tToast('logoUpdateFailed')),
  });

  const deleteLogoMutation = useMutation({
    mutationFn: ({ orgId: id, logoUrl }: { orgId: string; logoUrl: string }) =>
      deleteOrganizationLogo(id, logoUrl),
    onSuccess: () => {
      invalidateOrg();
      toast.success(tToast('logoRemoved'));
    },
    onError: () => toast.error(tToast('logoUpdateFailed')),
  });

  const regenerateLogoMutation = useMutation({
    mutationFn: ({
      orgId: id,
      logoUrl,
      updateFirestore,
    }: {
      orgId: string;
      logoUrl: string;
      updateFirestore?: boolean;
    }) => regenerateOrganizationLogoUrl(id, logoUrl, updateFirestore),
    onSuccess: () => invalidateOrg(),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => toast.success(t('settings.security.changePassword.success')),
    onError: () => toast.error(tToast('passwordResetFailed')),
  });

  return {
    updateOrganization: updateOrgMutation.mutateAsync,
    isSavingOrg: updateOrgMutation.isPending,
    updateUser: updateUserMutation.mutateAsync,
    isUpdatingUser: updateUserMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    deleteAvatar: deleteAvatarMutation.mutateAsync,
    isDeletingAvatar: deleteAvatarMutation.isPending,
    uploadLogo: uploadLogoMutation.mutateAsync,
    isUploadingLogo: uploadLogoMutation.isPending,
    deleteLogo: deleteLogoMutation.mutateAsync,
    regenerateLogo: regenerateLogoMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}
