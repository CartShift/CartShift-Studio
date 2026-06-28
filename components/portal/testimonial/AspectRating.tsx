'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import { aspectCardVariants } from './testimonial-variants';

interface AspectRatingProps {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

export function AspectRating({ icon: Icon, label, value, onChange, color }: AspectRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  return (
    <div className={cn(aspectCardVariants({ selected: value > 0 }))}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1.5 rounded-lg', color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs font-bold text-surface-700 dark:text-surface-300">{label}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md"
            >
              <Star
                className={cn(
                  'w-4 h-4 transition-all duration-150',
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-surface-300 dark:text-surface-600 hover:text-amber-300'
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
