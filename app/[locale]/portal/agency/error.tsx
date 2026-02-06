'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function AgencyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('portal');

  useEffect(() => {
    console.error('[Portal Agency Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-8">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-surface-900 dark:text-white">
          {t('common.somethingWentWrong')}
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-md">
          {error.message || t('common.unexpectedError')}
        </p>
      </div>
      <Button onClick={reset} variant="primary" size="sm">
        {t('common.tryAgain')}
      </Button>
    </div>
  );
}
