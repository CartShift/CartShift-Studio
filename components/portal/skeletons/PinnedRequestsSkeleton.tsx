'use client';

/**
 * Pinned Requests Skeleton
 *
 * A loading skeleton matching the pinned requests section structure.
 */

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

interface PinnedRequestsSkeletonProps {
  count?: number;
  className?: string;
}

export function PinnedRequestsSkeleton({ count = 3, className }: PinnedRequestsSkeletonProps) {
  return (
    <Card
      variant="glass"
      accent="warning"
      padding="sm"
      className={cn('overflow-hidden', className)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="w-6 h-6 rounded-lg" />
        <Skeleton className="h-3 w-20" />
        <div className="flex-1" />
        <Skeleton className="w-6 h-5 rounded-full" />
      </div>

      {/* Pinned items */}
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/50 dark:border-amber-500/20"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="w-16 h-5 rounded-full" />
                  <Skeleton className="w-12 h-3" />
                </div>
              </div>
              <Skeleton className="w-6 h-6 rounded-lg flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default PinnedRequestsSkeleton;
