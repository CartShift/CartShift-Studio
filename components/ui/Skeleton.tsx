'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import React from 'react';

const skeletonVariants = cva('', {
  variants: {
    variant: {
      default: 'rounded-lg',
      circular: 'rounded-full',
      rounded: 'rounded-2xl',
      text: 'rounded-md h-4',
      button: 'rounded-xl',
      badge: 'rounded-lg',
    },
    animation: {
      pulse: 'animate-pulse bg-surface-200 dark:bg-surface-800',
      shimmer: 'skeleton-shimmer',
      wave: 'skeleton-shimmer',
      none: 'bg-surface-200 dark:bg-surface-800',
    },
    intensity: {
      light: 'opacity-60',
      normal: 'opacity-80',
      strong: 'opacity-100',
    },
  },
  defaultVariants: {
    variant: 'default',
    animation: 'shimmer',
    intensity: 'normal',
  },
});

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof skeletonVariants> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant,
  animation,
  intensity,
  width,
  height,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, animation, intensity }), className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
      role="presentation"
      {...props}
    />
  );
}

// Pre-built skeleton variants for common patterns
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : i === lines - 2 ? 'w-5/6' : 'w-full')}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

const avatarSizeVariants = cva('', {
  variants: {
    size: {
      xs: 'w-6 h-6',
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export function SkeletonAvatar({
  size,
}: {
  size?: VariantProps<typeof avatarSizeVariants>['size'];
}) {
  return <Skeleton variant="circular" className={avatarSizeVariants({ size })} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'p-5 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/50 dark:bg-surface-900/50',
        className
      )}
    >
      <div className="flex items-start gap-4 mb-5">
        <SkeletonAvatar size="md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton variant="badge" className="h-6 w-16" />
      </div>
      <SkeletonText lines={2} />
      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-surface-100/50 dark:border-surface-800/50">
        <Skeleton variant="badge" className="h-6 w-16 rounded-full" />
        <Skeleton variant="badge" className="h-6 w-20 rounded-full" />
        <div className="flex-1" />
        <Skeleton variant="circular" className="h-8 w-8" />
      </div>
    </div>
  );
}

export function SkeletonButton({
  className,
  size = 'md',
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };
  return <Skeleton variant="button" className={cn(sizeClasses[size], className)} />;
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3 rounded-2xl border border-surface-200/50 dark:border-surface-800/50 bg-white/30 dark:bg-surface-900/30 p-4">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-surface-200/50 dark:border-surface-800/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex gap-4 py-3"
          style={{ animationDelay: `${rowIndex * 50}ms` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`row-${rowIndex}-col-${colIndex}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// New skeleton variants for specific use cases
export function SkeletonList({ items = 4, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl bg-surface-50/50 dark:bg-surface-800/30"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <Skeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ className }: { className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-surface-200/50 dark:border-surface-800/50 bg-white/30 dark:bg-surface-900/30"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <Skeleton className="h-3 w-1/2 mb-3" />
          <Skeleton className="h-8 w-2/3 mb-2" />
          <Skeleton className="h-2 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// Additional specific skeleton rows can either be here or in specific feature components.
// For unification, I'll keep the generic ones here.
export function SkeletonRequestRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-surface-50 dark:border-surface-900 last:border-b-0">
      <Skeleton className="w-16 h-5" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="w-20 h-6 rounded-full" />
      <Skeleton className="w-24 h-4" />
    </div>
  );
}

export function SkeletonMemberCard() {
  return (
    <div className="flex items-center gap-4 p-4 border border-surface-100 dark:border-surface-800 rounded-2xl">
      <SkeletonAvatar />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="w-16 h-6 rounded-full" />
    </div>
  );
}

export function SkeletonFileRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-surface-50 dark:border-surface-900 last:border-b-0">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="w-16 h-4" />
      <Skeleton className="w-8 h-8 rounded-lg" />
    </div>
  );
}

export { skeletonVariants, avatarSizeVariants };
