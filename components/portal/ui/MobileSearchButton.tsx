'use client';

import { usePortalTranslations } from '@/lib/i18n/translations';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile search trigger button (for header)
export function MobileSearchButton({
  onClickAction,
  className,
}: {
  onClickAction: () => void;
  className?: string;
}) {
  const t = usePortalTranslations();

  return (
    <button
      onClick={onClickAction}
      className={cn(
        'p-3 rounded-2xl text-surface-400 hover:text-surface-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-surface-900 transition-all md:hidden',
        className
      )}
      aria-label={t('accessibility.search')}
      title={t('accessibility.search')}
    >
      <Search size={24} />
    </button>
  );
}
