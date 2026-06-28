'use client';

import { Dispatch, SetStateAction } from 'react';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { PortalFormField } from '@/components/portal/ui/PortalFormField';
import type { AgencyBrandingProfile } from '@/components/portal/settings/AgencyBrandingSettings';

interface AgencyProfileSettingsTabProps {
  profile: AgencyBrandingProfile;
  setProfile: Dispatch<SetStateAction<AgencyBrandingProfile>>;
  saving: boolean;
  onSave: () => void;
}

export function AgencyProfileSettingsTab({
  profile,
  setProfile,
  saving,
  onSave,
}: AgencyProfileSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
      <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 font-outfit">
        {t('agency.settings.profile.title')}
      </h3>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label={t('agency.settings.profile.nameLabel')}
            value={profile.name}
            onChange={e => setProfile({ ...profile, name: e.target.value })}
            placeholder={t('agency.settings.profile.namePlaceholder')}
            className="font-outfit"
          />
          <Input
            label={t('agency.settings.profile.emailLabel')}
            type="email"
            value={profile.email}
            onChange={e => setProfile({ ...profile, email: e.target.value })}
            placeholder={t('agency.settings.profile.emailPlaceholder')}
            className="font-outfit"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label={t('agency.settings.profile.websiteLabel')}
            type="url"
            value={profile.website}
            onChange={e => setProfile({ ...profile, website: e.target.value })}
            placeholder={t('agency.settings.profile.websitePlaceholder')}
            className="font-outfit"
          />
          <Input
            label={t('agency.settings.profile.phoneLabel')}
            type="tel"
            value={profile.phone}
            onChange={e => setProfile({ ...profile, phone: e.target.value })}
            placeholder={t('agency.settings.profile.phonePlaceholder')}
            className="font-outfit"
          />
        </div>
        <PortalFormField label={t('agency.settings.profile.descLabel')}>
          <Textarea
            value={profile.description}
            onChange={e => setProfile({ ...profile, description: e.target.value })}
            rows={4}
            className="resize-none font-medium"
            placeholder={t('agency.settings.profile.descPlaceholder')}
          />
        </PortalFormField>
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
