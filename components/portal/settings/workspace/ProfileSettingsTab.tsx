'use client';

import { Dispatch, SetStateAction } from 'react';
import { Save, User as UserIcon, Camera, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { PortalFormGrid } from '@/components/portal/ui/PortalFormField';

export interface ProfileFormData {
  name: string;
  photoUrl: string;
}

interface ProfileSettingsTabProps {
  profileFormData: ProfileFormData;
  setProfileFormData: Dispatch<SetStateAction<ProfileFormData>>;
  userEmail?: string;
  saving: boolean;
  uploadingAvatar: boolean;
  onSave: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
}

export function ProfileSettingsTab({
  profileFormData,
  setProfileFormData,
  userEmail,
  saving,
  uploadingAvatar,
  onSave,
  onAvatarUpload,
  onRemoveAvatar,
}: ProfileSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <div className="space-y-6">
      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 border border-primary-100 dark:border-primary-900/30">
            <UserIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('settings.profile.title')}
            </h3>
            <p className="portal-label-sm text-[10px] mt-0.5">{t('settings.profile.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl bg-surface-50/50 dark:bg-surface-900/30 border border-surface-100 dark:border-surface-800/50">
            <div className="relative group">
              <Avatar
                src={profileFormData.photoUrl}
                name={profileFormData.name}
                size="lg"
                className="w-24 h-24 ring-4 ring-white dark:ring-surface-900 shadow-2xl"
              />
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <label className="absolute -bottom-1 -end-1 p-2 bg-primary-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-primary-700 transition-all hover:scale-110 active:scale-95">
                <Camera size={16} />
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={onAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>

            <div className="flex-1 text-center md:text-start">
              <h4 className="font-bold text-surface-900 dark:text-white mb-1 font-outfit">
                {t('settings.profile.avatar.title')}
              </h4>
              <p className="text-xs text-surface-500 dark:text-surface-400 mb-4 font-medium max-w-xs">
                {t('settings.profile.avatar.desc')}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-4 text-xs font-bold border-surface-200 dark:border-surface-800"
                  onClick={() =>
                    document.querySelector<HTMLInputElement>('input[type="file"]')?.click()
                  }
                >
                  {profileFormData.photoUrl
                    ? t('settings.profile.avatar.change')
                    : t('settings.profile.avatar.upload')}
                </Button>
                {profileFormData.photoUrl && (
                  <button
                    onClick={onRemoveAvatar}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-2 transition-colors"
                  >
                    {t('settings.profile.avatar.remove')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <PortalFormGrid>
            <Input
              label={t('settings.profile.name')}
              value={profileFormData.name}
              onChange={e => setProfileFormData({ ...profileFormData, name: e.target.value })}
              placeholder={t('settings.profile.namePlaceholder')}
            />
            <div className="opacity-60 grayscale pointer-events-none">
              <Input
                label={t('settings.profile.email')}
                value={userEmail || ''}
                readOnly
                placeholder="email@example.com"
              />
            </div>
          </PortalFormGrid>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800 flex justify-end">
          <Button
            onClick={onSave}
            loading={saving}
            className="flex items-center gap-2 shadow-xl shadow-primary-500/20 font-outfit px-8"
          >
            <Save size={18} />
            {saving ? t('settings.general.saving') : t('settings.profile.save')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
