'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ArrowRight, CheckCircle2, Clock3, Flame, Minus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const recommendationCardVariants = cva('border rounded-xl p-4 transition-colors', {
  variants: {
    impact: {
      high: 'bg-red-500/10 border-red-500/20',
      medium: 'bg-amber-500/10 border-amber-500/20',
      low: 'bg-surface-100 border-surface-200 dark:bg-surface-500/20 dark:border-surface-500/30',
    },
  },
  defaultVariants: {
    impact: 'medium',
  },
});

interface RecommendationCardProps {
  title: string;
  description?: string;
  action?: string;
  evidence?: string;
  effort?: 'quick' | 'medium' | 'advanced';
  sectionName: string;
  impact: 'high' | 'medium' | 'low';
  delay?: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  description,
  action,
  evidence,
  effort,
  sectionName,
  impact,
  delay = 0,
}) => {
  const t = useTranslations('analyzer');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const impactConfig = {
    high: {
      icon: Flame,
      label: t('impact.high'),
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      text: isDark ? 'text-red-400' : 'text-red-600',
    },
    medium: {
      icon: TrendingUp,
      label: t('impact.medium'),
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: isDark ? 'text-amber-400' : 'text-amber-600',
    },
    low: {
      icon: Minus,
      label: t('impact.low'),
      bg: isDark ? 'bg-surface-500/20' : 'bg-surface-100',
      border: isDark ? 'border-surface-500/30' : 'border-surface-200',
      text: isDark ? 'text-surface-400' : 'text-surface-600',
    },
  };

  const config = impactConfig[impact];
  const Icon = config.icon;
  const effortLabel = effort ? t(`recommendations.effort.${effort}` as any) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(recommendationCardVariants({ impact }))}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.text}`} />
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.border} ${config.text}`}
            >
              {config.label}
            </span>
          </div>
          <span className={`text-xs text-end ${config.text} opacity-70`}>{sectionName}</span>
        </div>
        <div className="space-y-2">
          <h4 className={`text-sm font-semibold leading-snug ${config.text}`}>{title}</h4>
          {description && (
            <p
              className={cn(
                'text-xs leading-relaxed',
                isDark ? 'text-white/70' : 'text-surface-700'
              )}
            >
              {description}
            </p>
          )}
        </div>
        {evidence && (
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-xs leading-relaxed',
              isDark
                ? 'border-white/10 bg-white/[0.03] text-white/60'
                : 'border-surface-200 bg-white/60 text-surface-600'
            )}
          >
            <span className="font-semibold">{t('recommendations.evidence')}:</span> {evidence}
          </div>
        )}
        {action && (
          <div className="flex items-start gap-2 text-xs leading-relaxed">
            <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.text}`} />
            <p className={isDark ? 'text-white/75' : 'text-surface-700'}>
              <span className="font-semibold">{t('recommendations.nextAction')}:</span> {action}
            </p>
          </div>
        )}
        {effortLabel && (
          <div
            className={cn(
              'flex w-fit items-center gap-1.5 text-xs',
              isDark ? 'text-white/50' : 'text-surface-500'
            )}
          >
            <Clock3 className="h-3.5 w-3.5" />
            {effortLabel}
          </div>
        )}
        <Link
          href="/contact"
          className={`flex w-fit items-center gap-1.5 text-xs font-semibold ${config.text} hover:opacity-80 transition-opacity`}
        >
          {t('recommendations.getHelp')}
          <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>
    </motion.div>
  );
};
