'use client';

import { usePortalTranslations } from '@/lib/i18n/translations';
import { Flame, Users, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface GlobalModifiersProps {
  urgent: boolean;
  recurring: boolean;
  selectedCount: number;
  onUrgentToggle: () => void;
  onRecurringToggle: () => void;
  onApplyGlobal: () => void;
  className?: string;
}

/**
 * GlobalModifiers component - Controls that apply to all selected requests
 * Follows AGENTS.md guidelines for RTL support and accessibility
 */
export function GlobalModifiers({
  urgent,
  recurring,
  selectedCount,
  onUrgentToggle,
  onRecurringToggle,
  onApplyGlobal,
  className,
}: GlobalModifiersProps) {
  const t = usePortalTranslations();

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 sm:me-auto">
          <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
            <Calculator size={16} className="text-surface-500" />
          </div>
          <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
            {t('pricing.globalModifiers' as never)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Urgent */}
          <button
            type="button"
            onClick={onUrgentToggle}
            aria-pressed={urgent}
            aria-label={t('pricing.modifiers.urgent')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500',
              urgent
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
            )}
          >
            <Flame size={14} />
            {t('pricing.modifiers.urgent')}
          </button>

          {/* Global Recurring */}
          <button
            type="button"
            onClick={onRecurringToggle}
            aria-pressed={recurring}
            aria-label={t('pricing.modifiers.recurring')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500',
              recurring
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
            )}
          >
            <Users size={14} />
            {t('pricing.modifiers.recurring')}
          </button>

          {selectedCount > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onApplyGlobal}
              aria-label={t('pricing.applyToAll')}
            >
              {t('pricing.applyToAll' as never)}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
