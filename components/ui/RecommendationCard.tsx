'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { ArrowRight, Flame, TrendingUp, Minus } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`border rounded-xl p-4 ${config.bg} ${config.border} transition-colors`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.text}`} />
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.border} ${config.text}`}
            >
              {config.label} Impact
            </span>
          </div>
          <span className={`text-xs ${config.text} opacity-60`}>{sectionName}</span>
        </div>
        <h4 className={`text-sm font-medium leading-snug ${config.text}`}>{title}</h4>
        <Link
          href="/contact"
          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${config.text} hover:opacity-80 transition-opacity`}
        >
          {t('recommendations.getHelp')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};
