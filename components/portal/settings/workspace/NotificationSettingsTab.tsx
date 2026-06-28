'use client';

import { Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';

export interface NotificationPrefs {
  emailOnRequestUpdate: boolean;
  emailOnNewComment: boolean;
  emailOnStatusChange: boolean;
  marketingEmails: boolean;
}

interface NotificationSettingsTabProps {
  notificationPrefs: NotificationPrefs;
  syncing: boolean;
  onSave: (prefs: NotificationPrefs) => void;
}

export function NotificationSettingsTab({
  notificationPrefs,
  syncing,
  onSave,
}: NotificationSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <div className="space-y-6">
      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 border border-primary-100 dark:border-primary-900/30">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('settings.notifications.title')}
            </h3>
            <p className="portal-label-sm text-[10px] mt-0.5">
              {t('settings.notifications.subtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <Switch
            label={t('settings.notifications.requestUpdate.label')}
            description={t('settings.notifications.requestUpdate.desc')}
            checked={notificationPrefs.emailOnRequestUpdate}
            onChange={checked =>
              onSave({ ...notificationPrefs, emailOnRequestUpdate: checked })
            }
          />
          <div className="h-px bg-surface-50 dark:bg-surface-900" />
          <Switch
            label={t('settings.notifications.commentAlerts.label')}
            description={t('settings.notifications.commentAlerts.desc')}
            checked={notificationPrefs.emailOnNewComment}
            onChange={checked => onSave({ ...notificationPrefs, emailOnNewComment: checked })}
          />
          <div className="h-px bg-surface-50 dark:bg-surface-900" />
          <Switch
            label={t('settings.notifications.statusChange.label')}
            description={t('settings.notifications.statusChange.desc')}
            checked={notificationPrefs.emailOnStatusChange}
            onChange={checked => onSave({ ...notificationPrefs, emailOnStatusChange: checked })}
          />
          <div className="h-px bg-surface-50 dark:bg-surface-900" />
          <Switch
            label={t('settings.notifications.marketing.label')}
            description={t('settings.notifications.marketing.desc')}
            checked={notificationPrefs.marketingEmails}
            onChange={checked => onSave({ ...notificationPrefs, marketingEmails: checked })}
          />
        </div>

        <div className="mt-10 pt-6 border-t border-surface-100 dark:border-surface-800">
          {syncing ? (
            <div className="flex items-center gap-2 text-[10px] font-black text-primary-600 animate-pulse tracking-widest uppercase">
              <Loader2 size={12} className="animate-spin" />
              {t('settings.notifications.syncing')}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-black text-surface-400 tracking-widest uppercase">
              <CheckCircle2 size={12} className="text-emerald-500" />
              {t('settings.notifications.saved')}
            </div>
          )}
        </div>
      </Card>

      <Card className="bg-surface-50/50 dark:bg-surface-900/30 border-surface-200 dark:border-surface-800 text-center py-10 rounded-3xl">
        <p className="text-[11px] font-bold text-surface-500 dark:text-surface-400 max-w-sm mx-auto uppercase tracking-widest leading-relaxed">
          {t('settings.notifications.pushBeta')} <br />
          <span className="text-primary-500 mt-2 block">
            {t('settings.notifications.pushBetaSub')}
          </span>
        </p>
      </Card>
    </div>
  );
}
