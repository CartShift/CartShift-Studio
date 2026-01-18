'use client';

/**
 * Analytics Skeleton
 *
 * A loading skeleton that matches the structure of the analytics dashboard.
 * Shows stat cards, charts, and metrics while data is loading.
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface AnalyticsSkeletonProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function AnalyticsSkeleton({ variant = 'full', className }: AnalyticsSkeletonProps) {
  if (variant === 'compact') {
    return <AnalyticsCompactSkeleton className={className} />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} index={i} />
        ))}
      </div>

      {/* Main chart */}
      <div className="p-6 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>

      {/* Secondary charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50">
          <Skeleton className="h-5 w-28 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <div className="p-5 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single stat card skeleton
 */
function StatCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="p-4 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Compact analytics skeleton for sidebar/widgets
 */
function AnalyticsCompactSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-surface-50/50 dark:bg-surface-800/30"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { StatCardSkeleton, AnalyticsCompactSkeleton };
