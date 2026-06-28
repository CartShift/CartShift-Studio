'use client';

import { User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { PortalSettingsSection } from '@/components/portal/ui/PortalSettingsSection';

export function BrandingPreviewSection() {
  const t = useTranslations('portal');

  return (
    <PortalSettingsSection
      title={t('agency.settings.brandingSections.preview')}
      description={t('agency.settings.brandingSections.previewDesc')}
    >
      <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800">
        <h4 className="portal-label-sm mb-6">{t('agency.settings.brandingSections.preview')}</h4>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full max-w-sm p-6 rounded-xl bg-white dark:bg-surface-950 border border-surface-200 dark:border-surface-800 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <User size={20} />
              </div>
              <div>
                <div className="h-4 w-24 bg-surface-100 dark:bg-surface-800 rounded mb-1.5" />
                <div className="h-3 w-16 bg-surface-50 dark:bg-surface-900 rounded" />
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="h-2 w-full bg-surface-50 dark:bg-surface-900 rounded" />
              <div className="h-2 w-5/6 bg-surface-50 dark:bg-surface-900 rounded" />
              <div className="h-2 w-4/6 bg-surface-50 dark:bg-surface-900 rounded" />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1">
                Primary
              </Button>
              <Button variant="outline" className="flex-1">
                Outline
              </Button>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex gap-3 flex-wrap">
              <span className="px-3 py-1 rounded bg-primary-100 text-primary-700 text-xs font-bold">
                Primary Badge
              </span>
              <span className="px-3 py-1 rounded bg-accent-100 text-accent-700 text-xs font-bold">
                Accent Badge
              </span>
              <span className="px-3 py-1 rounded bg-surface-100 text-surface-700 text-xs font-bold">
                Neutral Badge
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-500 shadow-lg shadow-primary-500/30" />
              <div className="w-12 h-12 rounded-lg bg-accent-500 shadow-lg shadow-accent-500/30" />
              <div className="w-12 h-12 rounded-lg bg-surface-900 dark:bg-white shadow-lg shadow-surface-900/10" />
            </div>
          </div>
        </div>
      </div>
    </PortalSettingsSection>
  );
}
