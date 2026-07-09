'use client';

import { Dispatch, SetStateAction } from 'react';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BrandingAssetsSection } from '@/components/portal/settings/branding/BrandingAssetsSection';
import { BrandingAppearanceSection } from '@/components/portal/settings/branding/BrandingAppearanceSection';
import { BrandingPreviewSection } from '@/components/portal/settings/branding/BrandingPreviewSection';

export interface AgencyBrandingProfile {
  name: string;
  email: string;
  website: string;
  phone?: string;
  description?: string;
  branding?: {
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    iconUrl?: string;
    fontFamily?: 'inter' | 'roboto' | 'outfit' | 'playfair';
    fontFamilyEn?: string;
    fontFamilyHe?: string;
    borderRadius?: '0px' | '0.5rem' | '1rem';
    invertLogoInDarkMode?: boolean;
  };
}

interface AgencyBrandingSettingsProps {
  profile: AgencyBrandingProfile;
  setProfile: Dispatch<SetStateAction<AgencyBrandingProfile>>;
  userUid?: string;
  saving: boolean;
  onSave: () => void;
}

export function AgencyBrandingSettings({
  profile,
  setProfile,
  userUid,
  saving,
  onSave,
}: AgencyBrandingSettingsProps) {
  const t = useTranslations('portal');

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
      <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 font-outfit">
        {t('settings.branding.title')}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
        {t('settings.branding.subtitle')}
      </p>

      <div className="space-y-4">
        <BrandingAssetsSection profile={profile} setProfile={setProfile} userUid={userUid} />
        <BrandingAppearanceSection profile={profile} setProfile={setProfile} />
        <BrandingPreviewSection />
      </div>

      <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-800 flex justify-end">
        <Button
          onClick={onSave}
          loading={saving}
          className="flex items-center gap-2 shadow-lg shadow-primary-500/20 font-outfit"
        >
          <Save size={18} />
          {saving ? t('agency.settings.profile.saving') : t('agency.settings.profile.save')}
        </Button>
      </div>
    </Card>
  );
}
