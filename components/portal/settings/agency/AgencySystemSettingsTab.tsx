'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';

interface SystemSettings {
  isPricingPageVisible: boolean;
  isMaintenancePageVisible: boolean;
}

interface AgencySystemSettingsTabProps {
  settings: SystemSettings;
  onUpdate: (patch: Partial<SystemSettings>) => void;
}

export function AgencySystemSettingsTab({ settings, onUpdate }: AgencySystemSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
      <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-6 font-outfit">
        {t('agency.settings.system.title')}
      </h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 mb-8">
        {t('agency.settings.system.subtitle')}
      </p>

      <div className="space-y-6">
        <Switch
          checked={settings.isPricingPageVisible}
          onChange={checked => onUpdate({ isPricingPageVisible: checked })}
          label={t('agency.settings.system.pricingPage.title')}
          description={t('agency.settings.system.pricingPage.description')}
          className="bg-surface-50 dark:bg-surface-900/30 rounded-xl border border-surface-200 dark:border-surface-800/50 p-4"
        />
        <Switch
          checked={settings.isMaintenancePageVisible}
          onChange={checked => onUpdate({ isMaintenancePageVisible: checked })}
          label={t('agency.settings.system.maintenancePage.title')}
          description={t('agency.settings.system.maintenancePage.description')}
          className="bg-surface-50 dark:bg-surface-900/30 rounded-xl border border-surface-200 dark:border-surface-800/50 p-4"
        />
      </div>
    </Card>
  );
}
