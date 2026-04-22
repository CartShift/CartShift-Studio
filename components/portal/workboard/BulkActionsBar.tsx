'use client';

import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';
import { Trash2, X } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onMoveTo: (status: string) => void;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onDelete,
  onMoveTo,
}: BulkActionsBarProps) {
  const t = useTranslations('portal');

  return (
    <div className="fixed bottom-6 start-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {selectedCount > 0 && (
          <m.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="flex items-center gap-4 bg-surface-900 text-white px-6 py-3 rounded-full shadow-2xl border border-surface-700/50 pointer-events-auto"
          >
            <div className="flex items-center gap-3 border-r border-surface-700 pe-4 me-1">
              <span className="font-bold text-sm bg-blue-600 px-2 py-0.5 rounded-md">
                {selectedCount}
              </span>
              <span className="text-sm font-medium text-surface-300 hidden sm:inline">
                {t('common.selected')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Move Actions */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-surface-400 me-2 uppercase font-bold tracking-wider hidden md:inline">
                  {t('workboard.bulkActions.moveTo')}
                </span>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-white hover:bg-surface-800"
                  onClick={() => onMoveTo('IN_PROGRESS')}
                >
                  {t('workboard.columns.inProgress')}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-white hover:bg-surface-800"
                  onClick={() => onMoveTo('IN_REVIEW')}
                >
                  {t('workboard.columns.review')}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-white hover:bg-surface-800"
                  onClick={() => onMoveTo('DELIVERED')}
                >
                  {t('workboard.columns.delivered')}
                </Button>
              </div>

              <div className="h-4 w-px bg-surface-700 mx-2" />

              <Button
                size="xs"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={onDelete}
              >
                <Trash2 size={14} className="me-1.5" />
                <span className="hidden sm:inline">{t('common.delete')}</span>
              </Button>

              <Button
                size="xs"
                variant="ghost"
                onClick={onClearSelection}
                className="text-surface-400 hover:text-white ms-2"
              >
                <X size={16} />
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
