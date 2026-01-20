'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Flame, TrendingUp, Minus } from 'lucide-react';
import Link from 'next/link';

interface RecommendationCardProps {
  title: string;
  sectionName: string;
  impact: 'high' | 'medium' | 'low';
  delay?: number;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  title,
  sectionName,
  impact,
  delay = 0,
}) => {
  const t = useTranslations();

  const impactConfig = {
    high: {
      icon: Flame,
      label: t('analyzer.impact.high') || 'High Impact',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      textColor: 'text-red-600 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
      badgeColor: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    },
    medium: {
      icon: TrendingUp,
      label: t('analyzer.impact.medium') || 'Medium Impact',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      textColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
      badgeColor: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    },
    low: {
      icon: Minus,
      label: t('analyzer.impact.low') || 'Low Impact',
      bgColor: 'bg-surface-50 dark:bg-surface-800',
      textColor: 'text-surface-600 dark:text-surface-400',
      borderColor: 'border-surface-200 dark:border-surface-700',
      badgeColor: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300',
    },
  };

  const config = impactConfig[impact];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`p-5 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all hover:shadow-md group`}
    >
      {/* Impact Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${config.badgeColor}`}
        >
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
        <span className="text-xs text-surface-500 dark:text-surface-400">{sectionName}</span>
      </div>

      {/* Title */}
      <h4 className="font-semibold text-surface-900 dark:text-white mb-3 leading-snug">{title}</h4>

      {/* CTA Link */}
      <Link
        href="/contact"
        className={`inline-flex items-center gap-1 text-sm font-medium ${config.textColor} hover:underline group-hover:gap-2 transition-all`}
      >
        {t('analyzer.recommendations.getHelp') || 'Get expert help'}
        <ArrowUpRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
};
