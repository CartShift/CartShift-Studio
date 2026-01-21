'use client';

import { Card, CardSectionTitle } from '@/components/ui/Card';
import { SalesMetrics } from '@/lib/types/portal';
import { Lightbulb, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface InsightsPanelProps {
  metrics: SalesMetrics;
  loading?: boolean;
}

export function InsightsPanel({ metrics, loading = false }: InsightsPanelProps) {
  const t = useTranslations('portal');

  // Simple logic to generate insights based on data
  // In a real app, this might come from an API or more complex calculation
  const getInsights = () => {
    const insights = [];

    // Revenue Trend Insight
    if (metrics.revenueGrowth > 0) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        title: t('sales.insights.growth.title'),
        description: t('sales.insights.growth.description', {
          percent: metrics.revenueGrowth.toFixed(1),
        }),
        action: t('sales.insights.growth.action'),
      });
    } else if (metrics.revenueGrowth < 0) {
      insights.push({
        type: 'negative',
        icon: TrendingDown,
        title: t('sales.insights.decline.title'),
        description: t('sales.insights.decline.description'),
        action: t('sales.insights.decline.action'),
      });
    }

    // Conversion/Proposal Insight
    const conversionRate =
      metrics.totalProposals > 0 ? (metrics.acceptedProposals / metrics.totalProposals) * 100 : 0;

    if (conversionRate > 50) {
      insights.push({
        type: 'positive',
        icon: Lightbulb,
        title: t('sales.insights.conversion.high.title'),
        description: t('sales.insights.conversion.high.description'),
        action: t('sales.insights.conversion.high.action'),
      });
    } else {
      insights.push({
        type: 'neutral',
        icon: Lightbulb,
        title: t('sales.insights.conversion.low.title'),
        description: t('sales.insights.conversion.low.description'),
        action: t('sales.insights.conversion.low.action'),
      });
    }

    return insights;
  };

  const insights = getInsights();

  if (loading) {
    return (
      <Card className="h-full">
        <CardSectionTitle icon={Lightbulb} className="mb-4">
          {t('sales.insights.title')}
        </CardSectionTitle>
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 animate-pulse"
            >
              <div className="w-10 h-10 rounded-full bg-surface-200 dark:bg-surface-700" />
              <div className="flex-1 space-y-2">
                <div className="w-1/3 h-4 bg-surface-200 dark:bg-surface-700 rounded" />
                <div className="w-3/4 h-3 bg-surface-200 dark:bg-surface-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardSectionTitle icon={Lightbulb} className="mb-4 text-amber-500">
        {t('sales.insights.title')}
      </CardSectionTitle>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'group relative overflow-hidden rounded-xl p-4 border transition-all duration-300',
              insight.type === 'positive' &&
                'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30 hover:border-emerald-200 dark:hover:border-emerald-700/50',
              insight.type === 'negative' &&
                'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/30 hover:border-rose-200 dark:hover:border-rose-700/50',
              insight.type === 'neutral' &&
                'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30 hover:border-blue-200 dark:hover:border-blue-700/50'
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'p-2.5 rounded-lg flex-shrink-0',
                  insight.type === 'positive' &&
                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
                  insight.type === 'negative' &&
                    'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
                  insight.type === 'neutral' &&
                    'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                )}
              >
                <insight.icon size={18} strokeWidth={2.5} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-surface-900 dark:text-white text-sm mb-1">
                  {insight.title}
                </h4>
                <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed mb-3">
                  {insight.description}
                </p>

                {insight.action && (
                  <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:underline transition-all">
                    <span
                      className={cn(
                        insight.type === 'positive' && 'text-emerald-600 dark:text-emerald-400',
                        insight.type === 'negative' && 'text-rose-600 dark:text-rose-400',
                        insight.type === 'neutral' && 'text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {insight.action}
                    </span>
                    <ArrowRight
                      size={12}
                      className={cn(
                        'transition-transform group-hover:translate-x-0.5',
                        insight.type === 'positive' && 'text-emerald-600 dark:text-emerald-400',
                        insight.type === 'negative' && 'text-rose-600 dark:text-rose-400',
                        insight.type === 'neutral' && 'text-blue-600 dark:text-blue-400'
                      )}
                    />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
