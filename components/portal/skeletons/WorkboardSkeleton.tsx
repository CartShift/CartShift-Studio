'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

const workboardCardVariants = cva(
  'p-4 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950',
  {
    variants: {
      variant: {
        default: '',
        ghost: 'bg-transparent border-dashed',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export function WorkboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <Skeleton
              variant="circular"
              className="w-8 h-8 ring-2 ring-white dark:ring-surface-950"
            />
            <Skeleton
              variant="circular"
              className="w-8 h-8 ring-2 ring-white dark:ring-surface-950"
            />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {[1, 2, 3, 4].map(col => (
          <div key={col} className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-4 w-4" />
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {Array.from({ length: col === 1 ? 3 : col === 2 ? 2 : col === 3 ? 1 : 2 }).map(
                (_, i) => (
                  <div key={i} className={cn(workboardCardVariants())}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <Skeleton className="h-4 w-14 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-4/5 mb-4" />
                    <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800">
                      <div className="flex items-center gap-3">
                        <Skeleton variant="circular" className="w-6 h-6" />
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-3 w-8" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Add Button */}
            <Skeleton className="h-10 w-full rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
