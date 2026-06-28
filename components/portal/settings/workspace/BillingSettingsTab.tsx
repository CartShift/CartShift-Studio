'use client';

import { CreditCard, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Organization } from '@/lib/types/portal';

interface BillingSettingsTabProps {
  organization: Organization | null;
  orgName: string;
}

export function BillingSettingsTab({ organization, orgName }: BillingSettingsTabProps) {
  const t = useTranslations('portal');

  return (
    <div className="space-y-6">
      <Card
        noPadding
        className="border-surface-200 dark:border-surface-800 shadow-xl overflow-hidden bg-white dark:bg-surface-950"
      >
        <div className="bg-primary-700 dark:bg-primary-800 p-8 text-white relative">
          <div className="absolute end-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <Badge className="bg-white/20 text-white border-white/20 uppercase font-black tracking-widest text-[9px] px-3">
                {orgName}
              </Badge>
              <span className="text-[10px] font-black text-primary-100 uppercase tracking-widest bg-primary-500/30 px-3 py-1 rounded-full">
                {organization?.plan?.toUpperCase() || t('common.free')}
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-1 font-outfit uppercase tracking-tight">
              {organization?.plan
                ? t(`portal.settings.billing.plans.${organization.plan}` as Parameters<typeof t>[0])
                : t('settings.billing.plans.free' as Parameters<typeof t>[0])}
            </h3>
            <p className="text-sm text-primary-100/70 font-medium font-outfit uppercase tracking-wider">
              {organization?.plan === 'enterprise'
                ? t('settings.billing.enterpriseStatus')
                : t('settings.billing.activeSubscription')}
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <p className="portal-label-sm text-[10px]">{t('settings.billing.investment')}</p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
                {organization?.plan === 'pro'
                  ? '$2,499'
                  : organization?.plan === 'enterprise'
                    ? 'Custom'
                    : '$0'}
                <span className="text-sm font-medium opacity-40 ms-1">
                  {organization?.plan === 'enterprise' ? '' : t('settings.billing.perMonth')}
                </span>
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="portal-label-sm text-[10px]">{t('settings.billing.workflowLimit')}</p>
              <p className="text-2xl font-bold text-emerald-500 font-outfit flex items-center gap-2">
                {organization?.plan === 'pro' || organization?.plan === 'enterprise'
                  ? t('settings.billing.unlimited')
                  : '1 Request'}
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="portal-label-sm text-[10px]">
                {t('settings.billing.teamAvailability')}
              </p>
              <p className="text-2xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
                {organization?.plan === 'free'
                  ? '2 Seats'
                  : organization?.plan === 'pro'
                    ? '10 Seats'
                    : t('settings.billing.unlimited')}
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-surface-100 dark:border-surface-800 flex flex-wrap gap-4">
            <Button className="flex items-center gap-2 font-outfit px-8 shadow-xl shadow-primary-500/10 h-11">
              <CreditCard size={18} /> {t('settings.billing.stripeDashboard')}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 font-outfit px-8 border-surface-200 dark:border-surface-800 h-11"
            >
              {t('settings.billing.invoicingHistory')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-primary-100 dark:border-primary-900/20 bg-primary-50/20 dark:bg-primary-900/5 shadow-sm rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 border border-primary-200/50 dark:border-primary-900/30">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-surface-900 dark:text-white mb-1.5 font-outfit">
              {t('settings.billing.encrypted.title')}
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed font-medium">
              {t('settings.billing.encrypted.desc')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
