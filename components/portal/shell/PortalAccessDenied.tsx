'use client';

import { AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { SUPPORT_EMAIL } from '@/lib/constants/contact';

export function PortalAccessDenied() {
  const t = useTranslations('portal.access');

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-500/10">
          <AlertCircle size={44} className="text-rose-600 dark:text-rose-400" />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white font-outfit tracking-tight">
            {t('restrictedTitle')}
          </h1>
          <p className="text-surface-500 dark:text-surface-400 font-medium leading-relaxed">
            {t('restrictedMessage')}
          </p>
        </div>
        <div className="pt-4 flex flex-col gap-3">
          <Link href={getPortalPath('/')}>
            <Button
              variant="primary"
              className="w-full h-12 font-outfit shadow-xl shadow-primary-500/20"
            >
              {t('switchWorkspace')}
            </Button>
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center justify-center w-full h-12 font-outfit font-semibold rounded-xl border border-surface-200 dark:border-surface-800 text-surface-900 dark:text-white hover:bg-surface-50 dark:hover:bg-surface-900 transition-colors"
          >
            {t('contactSupport')}
          </a>
        </div>
      </div>
    </div>
  );
}
