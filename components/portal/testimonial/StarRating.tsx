'use client';

import { useState, useMemo } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';
import { motion } from '@/lib/motion';
import { starVariants } from './testimonial-variants';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: VariantProps<typeof starVariants>['size'];
  label?: string;
  showLabel?: boolean;
}

export function StarRating({ value, onChange, size = 'md', label, showLabel = true }: StarRatingProps) {
  const t = useTranslations('portal');
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  const ratingLabels = useMemo(
    () => [
      t('testimonial.ratings.1'),
      t('testimonial.ratings.2'),
      t('testimonial.ratings.3'),
      t('testimonial.ratings.4'),
      t('testimonial.ratings.5'),
    ],
    [t]
  );

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-bold text-surface-700 dark:text-surface-300">{label}</label>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => {
          const isFilled = star <= displayValue;
          const isHovered = hoverValue !== null && star <= hoverValue;

          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="portal-focus-ring min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full"
            >
              <Star
                className={cn(
                  starVariants({
                    state: isFilled ? (isHovered ? 'hovered' : 'filled') : 'empty',
                    size,
                  })
                )}
              />
            </motion.button>
          );
        })}
        {showLabel && displayValue > 0 && (
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ms-3 text-sm font-medium text-surface-600 dark:text-surface-400"
          >
            {ratingLabels[displayValue - 1]}
          </motion.span>
        )}
      </div>
    </div>
  );
}
