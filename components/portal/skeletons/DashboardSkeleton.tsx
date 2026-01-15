'use client';

import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

const skeletonCardVariants = cva(
  'p-6 rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950',
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

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-11 w-36 rounded-xl" />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn(skeletonCardVariants())}>
            <div className="flex items-center justify-between mb-4">
              <Skeleton variant="circular" className="w-10 h-10" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-7 w-40" />
          <div className={cn(skeletonCardVariants(), 'space-y-6')}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton variant="circular" className="w-8 h-8 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className={cn(skeletonCardVariants())}>
            <div className="flex items-center gap-2 mb-6">
              <Skeleton variant="circular" className="w-4 h-4" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
