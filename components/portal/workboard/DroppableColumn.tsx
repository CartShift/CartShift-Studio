'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

const columnIndicatorVariants = cva('w-2 h-2 rounded-full', {
  variants: {
    color: {
      slate: 'bg-surface-500',
      blue: 'bg-blue-500',
      amber: 'bg-amber-500',
      emerald: 'bg-emerald-500',
    },
  },
  defaultVariants: {
    color: 'slate',
  },
});

const droppableAreaVariants = cva(
  'space-y-3 max-h-[calc(100dvh-220px)] md:max-h-[calc(100vh-280px)] overflow-y-auto portal-scrollbar min-h-[200px] rounded-2xl p-2 transition-colors duration-200',
  {
    variants: {
      isOver: {
        true: 'bg-blue-50/50 dark:bg-blue-500/5 ring-2 ring-blue-500/30 ring-inset',
        false: '',
      },
    },
    defaultVariants: {
      isOver: false,
    },
  }
);

interface DroppableColumnProps extends VariantProps<typeof columnIndicatorVariants> {
  id: string;
  title: string;
  itemIds: string[];
  itemCount: number;
  children: React.ReactNode;
  onAddClick?: () => void;
  onMoreClick?: () => void;
  emptyMessage?: string;
  isAdding?: boolean;
}

export function DroppableColumn({
  id,
  title,
  itemIds,
  itemCount,
  color,
  children,
  onAddClick,
  onMoreClick,
  emptyMessage,
  isAdding = false,
}: DroppableColumnProps) {
  const t = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id });
  const displayEmptyMessage = emptyMessage || t('portal.common.noItems');

  return (
    <div className="space-y-4">
      {/* Column Header */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(columnIndicatorVariants({ color }))} />
          <h3 className="text-xs font-black text-surface-900 dark:text-white uppercase tracking-widest">
            {title}
          </h3>
          <span className="px-1.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400 text-[10px] font-black">
            {itemCount}
          </span>
        </div>
        {onMoreClick && (
          <button
            onClick={onMoreClick}
            className="text-surface-400 hover:text-surface-900 dark:hover:text-white p-1 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="More options"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
      </div>

      {/* Droppable Area */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={cn(droppableAreaVariants({ isOver }))}>
          {itemCount === 0 && !isAdding ? (
            <div className="py-12 border-2 border-dashed border-surface-200 dark:border-surface-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-50">
              <PlusCircle size={24} className="mb-2 text-surface-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                {displayEmptyMessage}
              </span>
            </div>
          ) : (
            children
          )}
        </div>
      </SortableContext>

      {/* Add Button */}
      {onAddClick && (
        <button
          onClick={onAddClick}
          className="w-full py-2.5 rounded-xl border border-dashed border-surface-200 dark:border-surface-800 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 text-surface-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2 group"
        >
          <PlusCircle size={14} className="group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Add Item</span>
        </button>
      )}
    </div>
  );
}
