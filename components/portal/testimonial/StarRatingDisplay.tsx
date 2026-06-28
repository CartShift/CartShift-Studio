'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingDisplayProps {
  rating: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function StarRatingDisplay({ rating, size = 'sm', className }: StarRatingDisplayProps) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={cn(
            sizeClasses,
            star <= rating
              ? 'text-amber-400 fill-amber-400'
              : 'text-surface-300 dark:text-surface-600'
          )}
        />
      ))}
    </div>
  );
}
