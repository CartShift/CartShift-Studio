'use client';

import { ArrowLeft, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { RequestForm } from '@/components/portal/forms/RequestForm';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';

export default function NewRequestClient() {
  const orgId = useResolvedOrgId();
  const t = useTranslations('portal');

  if (!orgId || typeof orgId !== 'string') {
    return <div className="text-center py-20 text-surface-500">Invalid organization ID</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link
          href="/portal/requests/"
          className="p-2.5 border border-surface-200 dark:border-surface-800 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors shadow-sm bg-white dark:bg-surface-950"
        >
          <ArrowLeft size={20} className="text-surface-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
            {t('requests.new.title')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {t('requests.new.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-surface-200 dark:border-surface-800 shadow-sm">
            <RequestForm orgId={orgId} mode="create" />
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 shadow-sm">
            <h3 className="font-bold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
              <Info size={18} /> {t('requests.new.tips.title')}
            </h3>
            <ul className="text-xs text-blue-800/80 dark:text-blue-300/80 space-y-2 list-disc ps-4 leading-relaxed">
              <li>{t('requests.new.tips.tip1')}</li>
              <li>{t('requests.new.tips.tip2')}</li>
              <li>{t('requests.new.tips.tip3')}</li>
              <li>{t('requests.new.tips.tip4')}</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
