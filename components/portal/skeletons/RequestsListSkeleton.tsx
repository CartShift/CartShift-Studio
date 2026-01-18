'use client';

/**
 * Requests List Skeleton
 *
 * A loading skeleton that matches the structure of the requests list UI.
 * Provides visual feedback while request data is loading.
 */

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonAvatar } from '@/components/ui/Skeleton';

interface RequestsListSkeletonProps {
  /** Number of skeleton items to display */
  count?: number;
  /** Layout variant */
  variant?: 'list' | 'cards';
  /** Additional CSS classes */
  className?: string;
}

export function RequestsListSkeleton({
  count = 5,
  variant = 'list',
  className,
}: RequestsListSkeletonProps) {
  if (variant === 'cards') {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-3', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <RequestCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50 overflow-hidden',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <RequestRowSkeleton key={i} index={i} isLast={i === count - 1} />
      ))}
    </div>
  );
}

/**
 * Single request row skeleton for list view
 */
function RequestRowSkeleton({ index, isLast }: { index: number; isLast: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4',
        !isLast && 'border-b border-surface-100 dark:border-surface-800/50'
      )}
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Request ID badge */}
      <Skeleton className="w-16 h-5 rounded-lg flex-shrink-0" />

      {/* Request info */}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-5 w-3/4 max-w-[280px]" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Status badge */}
      <Skeleton className="w-20 h-6 rounded-full flex-shrink-0" />

      {/* Date */}
      <Skeleton className="w-24 h-4 flex-shrink-0 hidden md:block" />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-8 h-8 rounded-lg hidden sm:block" />
      </div>
    </div>
  );
}

/**
 * Single request card skeleton for card view
 */
function RequestCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="p-5 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-surface-100/50 dark:border-surface-800/50">
        <div className="flex items-center gap-2">
          <Skeleton className="w-16 h-5 rounded-full" />
          <Skeleton className="w-12 h-5 rounded-full" />
        </div>
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
  );
}

export { RequestRowSkeleton, RequestCardSkeleton };
