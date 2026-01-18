'use client';

import { cn } from '@/lib/utils';
import React, { useMemo } from 'react';
import { motion } from '@/lib/motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useTranslations } from 'next-intl';
import { FileText, Clock, CheckCircle2, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Request, REQUEST_STATUS, RequestStatus } from '@/lib/types/portal';
import { Timestamp } from '@/lib/types/portal';

interface ClientAnalyticsProps {
  requests: Request[];
  className?: string;
}

// Calculate days between two timestamps
const daysBetween = (start: Timestamp, end: Timestamp): number => {
  const startDate = start.toDate();
  const endDate = end.toDate();
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate average resolution time in days
const calculateAvgResolutionTime = (requests: Request[]): number => {
  const completedRequests = requests.filter(
    r =>
      r.closedAt &&
      (r.status === REQUEST_STATUS.CLOSED ||
        r.status === REQUEST_STATUS.DELIVERED ||
        r.status === REQUEST_STATUS.PAID)
  );

  if (completedRequests.length === 0) return 0;

  const totalDays = completedRequests.reduce((sum, r) => {
    return sum + daysBetween(r.createdAt, r.closedAt!);
  }, 0);

  return Math.round(totalDays / completedRequests.length);
};

// Format currency
const formatCurrency = (amountInCents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
};

// Calculate total spend
const calculateTotalSpend = (requests: Request[]): number => {
  return requests
    .filter(r => r.paidAt && r.totalAmount)
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);
};

// Get active request count
const getActiveCount = (requests: Request[]): number => {
  const activeStatuses: RequestStatus[] = [
    REQUEST_STATUS.NEW,
    REQUEST_STATUS.QUEUED,
    REQUEST_STATUS.IN_PROGRESS,
    REQUEST_STATUS.IN_REVIEW,
    REQUEST_STATUS.NEEDS_INFO,
    REQUEST_STATUS.QUOTED,
    REQUEST_STATUS.ACCEPTED,
  ];
  return requests.filter(r => activeStatuses.includes(r.status)).length;
};

// Get completed count
const getCompletedCount = (requests: Request[]): number => {
  const completedStatuses: RequestStatus[] = [
    REQUEST_STATUS.DELIVERED,
    REQUEST_STATUS.CLOSED,
    REQUEST_STATUS.PAID,
  ];
  return requests.filter(r => completedStatuses.includes(r.status)).length;
};

// Get requests from last 30 days
const getRecentRequests = (requests: Request[]): Request[] => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return requests.filter(r => {
    const createdDate = r.createdAt.toDate();
    return createdDate >= thirtyDaysAgo;
  });
};

export const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ requests, className }) => {
  const t = useTranslations();

  const analytics = useMemo(() => {
    const recentRequests = getRecentRequests(requests);
    const activeCount = getActiveCount(requests);
    const completedCount = getCompletedCount(requests);
    const avgResolution = calculateAvgResolutionTime(requests);
    const totalSpend = calculateTotalSpend(requests);

    // Calculate trend (compare to previous period)
    const previousPeriodRequests = requests.filter(r => {
      const createdDate = r.createdAt.toDate();
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return createdDate >= sixtyDaysAgo && createdDate < thirtyDaysAgo;
    });

    const recentCount = recentRequests.length;
    const previousCount = previousPeriodRequests.length;
    const trend =
      previousCount > 0
        ? Math.round(((recentCount - previousCount) / previousCount) * 100)
        : recentCount > 0
          ? 100
          : 0;

    return {
      total: requests.length,
      active: activeCount,
      completed: completedCount,
      avgResolution,
      totalSpend,
      recent: recentCount,
      trend,
      completionPercentage:
        requests.length > 0 ? Math.round((completedCount / requests.length) * 100) : 0,
    };
  }, [requests]);

  if (requests.length === 0) {
    return (
      <div className={cn('py-8', className)}>
        <EmptyState
          icon={Activity}
          title={t('portal.analytics.noDataYet')}
          description={t('portal.analytics.noDataDescription')}
          variant="plain"
          className="bg-transparent border-0"
        />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={cn('py-8', className)}>
        <EmptyState
          icon={Activity}
          title={t('portal.analytics.noDataYet')}
          description={t('portal.analytics.noDataDescription')}
          variant="plain"
          className="bg-transparent border-0"
        />
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Compact Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-4 rounded-2xl bg-surface-50/80 dark:bg-surface-900/50 border border-surface-200/50 dark:border-white/[0.04]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Total */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200/50 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <FileText size={16} className="text-blue-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-surface-900 dark:text-white leading-none">
                  <AnimatedNumber value={analytics.total} duration={800} />
                </div>
                <div className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
                  {t('portal.analytics.total')}
                </div>
              </div>
            </div>

            {/* Active */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200/50 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <Activity size={16} className="text-amber-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-surface-900 dark:text-white leading-none">
                  <AnimatedNumber value={analytics.active} duration={800} />
                </div>
                <div className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
                  {t('portal.analytics.active')}
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200/50 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-surface-900 dark:text-white leading-none">
                  <AnimatedNumber value={analytics.completed} duration={800} />
                </div>
                <div className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
                  {t('portal.analytics.done')}
                </div>
              </div>
            </div>

            {/* Avg Resolution */}
            {analytics.avgResolution > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-surface-800/80 border border-surface-200/50 dark:border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                  <Clock size={16} className="text-purple-500" />
                </div>
                <div>
                  <div className="text-lg font-bold text-surface-900 dark:text-white leading-none">
                    {analytics.avgResolution}d
                  </div>
                  <div className="text-[10px] text-surface-400 uppercase tracking-wider font-semibold">
                    {t('portal.analytics.avgResolution')}
                  </div>
                </div>
              </div>
            )}

            {/* Trend Badge */}
            {analytics.trend !== 0 && (
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold',
                  analytics.trend > 0
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                )}
              >
                <TrendingUp size={12} className={cn(analytics.trend < 0 && 'rotate-180')} />
                {Math.abs(analytics.trend)}% {t('portal.analytics.inLast30Days')}
              </div>
            )}
          </div>

          {/* Mini Progress */}
          {analytics.total > 0 && (
            <div className="flex items-center gap-3 ps-3 lg:border-s border-surface-200/50 dark:border-white/[0.06]">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    strokeWidth="4"
                    className="stroke-surface-200 dark:stroke-surface-700"
                  />
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="stroke-emerald-500"
                    initial={{ strokeDasharray: '0 100' }}
                    animate={{
                      strokeDasharray: `${analytics.completionPercentage} ${100 - analytics.completionPercentage}`,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ strokeDashoffset: 0 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-surface-600 dark:text-surface-300">
                  {analytics.completionPercentage}%
                </div>
              </div>
              <div className="text-xs text-surface-500 hidden sm:block">
                {t('portal.analytics.completionRate')}
              </div>
            </div>
          )}
        </div>

        {/* Spend Banner - only if there's spend data */}
        {analytics.totalSpend > 0 && (
          <div className="mt-3 pt-3 border-t border-surface-200/50 dark:border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500" />
              <span className="text-sm text-surface-500">{t('portal.analytics.totalSpend')}</span>
            </div>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(analytics.totalSpend)}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Compact version for dashboard sidebar
export const ClientAnalyticsCompact: React.FC<{
  requests: Request[];
  className?: string;
}> = ({ requests, className }) => {
  const t = useTranslations();

  const analytics = useMemo(() => {
    return {
      total: requests.length,
      active: getActiveCount(requests),
      completed: getCompletedCount(requests),
    };
  }, [requests]);

  const items = [
    { label: t('portal.analytics.total'), value: analytics.total, color: 'bg-blue-500' },
    { label: t('portal.analytics.active'), value: analytics.active, color: 'bg-amber-500' },
    { label: t('portal.analytics.done'), value: analytics.completed, color: 'bg-green-500' },
  ];

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', item.color)} />
          <span className="text-sm text-surface-500">{item.label}:</span>
          <span className="text-sm font-semibold text-surface-900 dark:text-white">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
};
