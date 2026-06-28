'use client';

import { Dispatch, SetStateAction } from 'react';
import { Camera, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { PortalSettingsSection } from '@/components/portal/ui/PortalSettingsSection';
import { uploadAgencyAsset } from '@/lib/services/portal-uploads';
import type { AgencyBrandingProfile } from '@/components/portal/settings/AgencyBrandingSettings';

interface BrandingAssetsSectionProps {
  profile: AgencyBrandingProfile;
  setProfile: Dispatch<SetStateAction<AgencyBrandingProfile>>;
  userUid?: string;
}

export function BrandingAssetsSection({ profile, setProfile, userUid }: BrandingAssetsSectionProps) {
  const t = useTranslations('portal');

  return (
    <PortalSettingsSection
      title={t('agency.settings.brandingSections.assets')}
      description={t('agency.settings.brandingSections.assetsDesc')}
      defaultOpen
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-2">
            {t('settings.branding.logo.title' as any)}
          </h4>
          <p className="text-xs text-surface-500 mb-4">
            {t('settings.branding.logo.description' as any)}
          </p>
          <div className="p-6 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-xl flex flex-col items-center justify-center gap-4 bg-surface-50/50 dark:bg-surface-900/30">
            {profile.branding?.logoUrl ? (
              <div className="relative group w-full h-24 flex items-center justify-center">
                <img
                  src={profile.branding.logoUrl}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={() =>
                    setProfile({
                      ...profile,
                      branding: { ...profile.branding, logoUrl: '' },
                    })
                  }
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold rounded-lg"
                >
                  {t('settings.branding.logo.remove' as any)}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <input
                  type="file"
                  id="logo-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file || !userUid) return;
                    try {
                      const url = await uploadAgencyAsset(userUid, file, 'logo');
                      setProfile({
                        ...profile,
                        branding: { ...profile.branding, logoUrl: url },
                      });
                    } catch (err) {
                      console.error('Logo upload failed', err);
                      toast.error(t('agency.settings.profile.failedToUpload'));
                    }
                  }}
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex flex-col items-center gap-2 text-surface-500 hover:text-primary-600 transition-colors"
                >
                  <Camera size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {t('settings.branding.logo.upload' as any)}
                  </span>
                </label>
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              id="invert-logo"
              checked={profile.branding?.invertLogoInDarkMode || false}
              onChange={e =>
                setProfile({
                  ...profile,
                  branding: {
                    ...profile.branding,
                    invertLogoInDarkMode: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded border-surface-300 text-primary-600 focus-visible:ring-primary-500/40"
            />
            <label
              htmlFor="invert-logo"
              className="text-sm font-medium text-surface-700 dark:text-surface-300 cursor-pointer select-none"
            >
              {t('settings.branding.darkmode.invertLogo' as any)}
            </label>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-surface-900 dark:text-white mb-2">
            {t('settings.branding.icon.title' as any)}
          </h4>
          <p className="text-xs text-surface-500 mb-4">
            {t('settings.branding.icon.description' as any)}
          </p>
          <div className="p-6 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-xl flex flex-col items-center justify-center gap-4 bg-surface-50/50 dark:bg-surface-900/30">
            {profile.branding?.iconUrl ? (
              <div className="relative group w-16 h-16 flex items-center justify-center">
                <img
                  src={profile.branding.iconUrl}
                  alt="Icon"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={() =>
                    setProfile({
                      ...profile,
                      branding: { ...profile.branding, iconUrl: '' },
                    })
                  }
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold rounded-lg"
                >
                  {t('settings.branding.icon.remove' as any)}
                </button>
              </div>
            ) : (
              <div className="text-center">
                <input
                  type="file"
                  id="icon-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file || !userUid) return;
                    try {
                      const url = await uploadAgencyAsset(userUid, file, 'icon');
                      setProfile({
                        ...profile,
                        branding: { ...profile.branding, iconUrl: url },
                      });
                    } catch (err) {
                      console.error('Icon upload failed', err);
                      toast.error(t('agency.settings.profile.failedToUpload'));
                    }
                  }}
                />
                <label
                  htmlFor="icon-upload"
                  className="cursor-pointer flex flex-col items-center gap-2 text-surface-500 hover:text-primary-600 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {t('settings.branding.icon.upload' as any)}
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalSettingsSection>
  );
}
