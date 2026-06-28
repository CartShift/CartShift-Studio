'use client';

import { Shield, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardSectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PortalFormGrid } from '@/components/portal/ui/PortalFormField';
import { cn } from '@/lib/utils';

interface SecuritySettingsTabProps {
  userEmail?: string;
  providerId?: string;
  resetSent: boolean;
  resettingPassword?: boolean;
  onPasswordReset: () => void;
}

export function SecuritySettingsTab({
  userEmail,
  providerId,
  resetSent,
  resettingPassword,
  onPasswordReset,
}: SecuritySettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <div className="space-y-6">
      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-100 dark:border-amber-900/30">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
              {t('settings.security.title')}
            </h3>
            <p className="portal-label-sm text-[10px] mt-0.5">{t('settings.security.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-surface-50 dark:bg-surface-900/50 border border-surface-100 dark:border-surface-800 transition-colors">
            <div className="space-y-1">
              <h4 className="font-bold text-surface-900 dark:text-white text-base font-outfit">
                {t('settings.security.changePassword.title')}
              </h4>
              <p className="text-xs font-medium text-surface-500 leading-relaxed">
                {t('settings.security.changePassword.desc')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onPasswordReset}
              disabled={resetSent}
              loading={resettingPassword}
              className={cn(
                'font-outfit whitespace-nowrap px-6',
                resetSent &&
                  'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              )}
            >
              {resetSent ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} /> {t('settings.security.changePassword.sent')}
                </div>
              ) : (
                t('settings.security.changePassword.button')
              )}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-surface-50/50 dark:bg-surface-900/20 border border-surface-100/50 dark:border-surface-800/50 opacity-60">
            <div className="space-y-1">
              <h4 className="font-bold text-surface-900 dark:text-white text-base font-outfit">
                {t('settings.security.mfa.title')}
              </h4>
              <p className="text-xs font-medium text-surface-500 leading-relaxed">
                {t('settings.security.mfa.desc')}
              </p>
            </div>
            <Badge variant="gray" className="font-black uppercase tracking-widest text-[9px]">
              {t('settings.security.mfa.badge')}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="border-surface-200 dark:border-surface-800 shadow-sm bg-white dark:bg-surface-950">
        <CardSectionTitle as="h4" className="mb-6">
          {t('settings.security.session.title')}
        </CardSectionTitle>
        <PortalFormGrid>
          <div>
            <p className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-2.5">
              {t('settings.security.session.email')}
            </p>
            <p className="text-sm font-bold text-surface-900 dark:text-white font-outfit">
              {userEmail}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-2.5">
              {t('settings.security.session.provider')}
            </p>
            <p className="text-sm font-bold text-surface-900 dark:text-white capitalize font-outfit flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {providerId?.split('.')[0] || t('settings.security.session.mailService')}
            </p>
          </div>
        </PortalFormGrid>
      </Card>
    </div>
  );
}
