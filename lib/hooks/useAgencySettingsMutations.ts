'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { updateAgency } from '@/lib/services/portal-agency';
import { updatePortalUser } from '@/lib/services/portal-users';
import { uploadUserProfilePicture } from '@/lib/services/portal-uploads';
import { updateGlobalBranding } from '@/lib/services/portal-branding';
import { deleteService } from '@/lib/services/portal-services';
import { portalToast as toast } from '@/lib/utils/portal-toast';
import { invalidatePortalTeamData } from '@/lib/utils/portal-cache-invalidation';
import { queryKeys } from '@/lib/utils/query-keys';
import type { BrandingData } from '@/lib/services/portal-branding';
import type { Agency } from '@/lib/types/portal';

export function useAgencySettingsMutations(agencyId?: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('portal');
  const tToast = useTranslations('portal.toast');

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<Exclude<Agency, 'id'>>) => {
      if (!agencyId) throw new Error('Agency ID required');
      return updateAgency(agencyId, data);
    },
    onSuccess: () => {
      if (agencyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.agency.profile(agencyId) });
      }
      toast.success(t('agency.settings.profile.success'));
    },
    onError: (error: Error) => {
      toast.error(tToast('settingsSaveFailed'), error.message);
    },
  });

  const updateBrandingMutation = useMutation({
    mutationFn: ({ branding, userId }: { branding: BrandingData; userId: string }) =>
      updateGlobalBranding(branding, userId),
    onError: () => {
      toast.error(tToast('brandingUpdateFailed'));
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: Parameters<typeof updatePortalUser>[1];
    }) => updatePortalUser(userId, data),
    onSuccess: () => {
      toast.success(tToast('profileUpdated'));
    },
    onError: () => {
      toast.error(tToast('profileUpdateFailed'));
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      uploadUserProfilePicture(userId, file),
    onSuccess: () => {
      toast.success(tToast('avatarUpdated'));
    },
    onError: () => {
      toast.error(tToast('avatarUpdateFailed'));
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.agency });
      toast.success(tToast('serviceDeleted'));
    },
    onError: () => {
      toast.error(tToast('serviceDeleteFailed'));
    },
  });

  const invalidateTeam = () => invalidatePortalTeamData(queryClient);

  return {
    updateProfile: updateProfileMutation.mutateAsync,
    isSavingProfile: updateProfileMutation.isPending,
    updateBranding: updateBrandingMutation.mutateAsync,
    updateUser: updateUserMutation.mutateAsync,
    isSavingUser: updateUserMutation.isPending,
    uploadAvatar: uploadAvatarMutation.mutateAsync,
    isUploadingAvatar: uploadAvatarMutation.isPending,
    deleteService: deleteServiceMutation.mutateAsync,
    isDeletingService: deleteServiceMutation.isPending,
    invalidateTeam,
  };
}
