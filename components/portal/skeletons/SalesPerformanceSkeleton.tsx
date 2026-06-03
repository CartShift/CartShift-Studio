'use client';

/**
 * Sales Performance Skeleton
 *
 * A loading skeleton matching the sales performance dashboard structure.
 * Shows metric cards, revenue bars, and top clients while data loads.
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface SalesPerformanceSkeletonProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function SalesPerformanceSkeleton({
  variant = 'full',
  className,
}: SalesPerformanceSkeletonProps) {
  if (variant === 'compact') {
    return <SalesCompactSkeleton className={className} />;
  }

  return (
    <div className={cn('space-y-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 min-[920px]:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCardSkeleton key={i} index={i} />
        ))}
      </div>

      {/* Revenue chart */}
      <div className="p-4 rounded-xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50">
        <div className="flex items-center justify-between mb-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Revenue bars */}
        <div className="flex items-end justify-between h-40 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                className="w-full rounded-t-lg"
                style={{
                  height: `${Math.random() * 60 + 40}%`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top clients */}
        <div className="p-4 rounded-xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-50/50 dark:bg-surface-800/30"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>

        {/* Mini stats */}
        <div className="p-4 rounded-xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-surface-50/50 dark:bg-surface-800/30"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Skeleton className="w-6 h-6 rounded-lg" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single metric card skeleton
 */
function MetricCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="min-h-[118px] p-3.5 rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, hsl(${index * 60 + 160}, 50%, 40%) 0%, hsl(${index * 60 + 180}, 50%, 30%) 100%)`,
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-9 h-9 rounded-lg bg-white/20" animation="pulse" />
        <Skeleton className="w-16 h-5 rounded-full bg-white/20" animation="pulse" />
      </div>
      <Skeleton className="h-3 w-20 mb-2 bg-white/20" animation="pulse" />
      <Skeleton className="h-6 w-24 mb-1 bg-white/30" animation="pulse" />
      <Skeleton className="h-3 w-16 bg-white/15" animation="pulse" />
    </div>
  );
}

/**
 * Compact sales skeleton for sidebar/widgets
 */
function SalesCompactSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-surface-50/50 dark:bg-surface-800/30"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="h-3 w-12 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export { MetricCardSkeleton, SalesCompactSkeleton };
