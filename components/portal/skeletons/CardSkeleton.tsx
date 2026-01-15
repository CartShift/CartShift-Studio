'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardSkeletonVariants = cva('', {
  variants: {
    variant: {
      default: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      compact: 'space-y-3',
      horizontal: 'space-y-4',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

const cardSkeletonItemVariants = cva(
  'rounded-2xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950',
  {
    variants: {
      variant: {
        default: 'p-6',
        compact: 'p-4 rounded-xl flex items-center gap-4',
        horizontal: 'p-5 flex items-start gap-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface CardSkeletonProps extends VariantProps<typeof cardSkeletonVariants> {
  count?: number;
  className?: string;
}

export function CardSkeleton({ variant = 'default', count = 1, className }: CardSkeletonProps) {
  const cards = Array.from({ length: count });

  const renderCard = (index: number) => {
    if (variant === 'compact') {
      return (
        <div key={index} className={cn(cardSkeletonItemVariants({ variant }))}>
          <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      );
    }

    if (variant === 'horizontal') {
      return (
        <div key={index} className={cn(cardSkeletonItemVariants({ variant }))}>
          <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center gap-3 pt-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      );
    }

    // Default variant
    return (
      <div key={index} className={cn(cardSkeletonItemVariants({ variant }))}>
        <div className="flex items-start gap-4 mb-4">
          <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-surface-100 dark:border-surface-800">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    );
  };

  return (
    <div className={cn(cardSkeletonVariants({ variant }), className)}>
      {cards.map((_, i) => renderCard(i))}
    </div>
  );
}

export { cardSkeletonVariants, cardSkeletonItemVariants };
