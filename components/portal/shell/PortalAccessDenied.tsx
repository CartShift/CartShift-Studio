'use client';

import { AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { PortalButton } from '../ui/PortalButton';
import { getPortalPath } from '@/lib/utils/portal-paths';

export function PortalAccessDenied() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-500/10">
          <AlertCircle size={44} className="text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
            {t('portal.access.restrictedTitle')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 font-medium leading-relaxed">
            {t('portal.access.restrictedMessage')}
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <Link href={getPortalPath('/')}>
            <PortalButton
              variant="primary"
              className="w-full h-12 font-outfit shadow-xl shadow-blue-500/20"
            >
              {t('portal.access.switchWorkspace')}
            </PortalButton>
          </Link>
          <PortalButton
            variant="outline"
            className="w-full h-12 font-outfit border-surface-200 dark:border-surface-800"
          >
            {t('portal.access.contactSupport')}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}
