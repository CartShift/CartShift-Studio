'use client';

import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { ThumbsUp, Heart, Check } from 'lucide-react';
import { motion } from '@/lib/motion';

interface RecommendToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function RecommendToggle({ value, onChange }: RecommendToggleProps) {
  const t = useTranslations('portal');

  return (
    <motion.button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'portal-focus-ring w-full p-4 rounded-2xl border-2 transition-all duration-300',
        'flex items-center gap-4',
        value
          ? 'border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
          : 'border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 hover:border-emerald-200 dark:hover:border-emerald-800'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <motion.div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
          value
            ? 'bg-emerald-600 dark:bg-emerald-500 shadow-lg shadow-emerald-500/30'
            : 'bg-surface-200 dark:bg-surface-700'
        )}
        animate={value ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {value ? (
          <Heart className="w-6 h-6 text-white fill-white" />
        ) : (
          <ThumbsUp className="w-6 h-6 text-surface-400" />
        )}
      </motion.div>
      <div className="text-start flex-1">
        <p className="font-bold text-surface-900 dark:text-white">
          {t('testimonial.testimonial.wouldRecommend')}
        </p>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          {value
            ? t('testimonial.testimonial.wouldRecommendYes')
            : t('testimonial.testimonial.wouldRecommendNo')}
        </p>
      </div>
      <motion.div
        className={cn(
          'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0',
          value ? 'border-emerald-500 bg-emerald-500' : 'border-surface-300 dark:border-surface-600'
        )}
        animate={value ? { scale: [1, 1.15, 1] } : {}}
      >
        {value && <Check className="w-5 h-5 text-white" />}
      </motion.div>
    </motion.button>
  );
}
