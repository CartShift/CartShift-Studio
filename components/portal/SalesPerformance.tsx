/**
 * SalesPerformance Component
 *
 * A beautiful, animated dashboard showing sales metrics,
 * revenue trends, and performance indicators.
 */

'use client';

import React from 'react';
import { motion } from '@/lib/motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import { Skeleton as PortalSkeleton } from '@/components/ui/Skeleton';
import { useSalesMetrics, useMonthlyRevenue, useTopClients } from '@/lib/hooks/useSalesAnalytics';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Target,
  Clock,
  Zap,
  Crown,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { CURRENCY_CONFIG, Currency } from '@/lib/types/portal';

// ============================================
// METRIC CARD VARIANTS
// ============================================

const metricCardVariants = cva(
  'relative p-5 rounded-2xl overflow-hidden group transition-all duration-300',
  {
    variants: {
      intent: {
        revenue: [
          'bg-gradient-to-br from-emerald-500 to-teal-600',
          'text-white',
          'shadow-lg shadow-emerald-500/25',
        ],
        growth: [
          'bg-gradient-to-br from-blue-500 to-indigo-600',
          'text-white',
          'shadow-lg shadow-blue-500/25',
        ],
        clients: [
          'bg-gradient-to-br from-purple-500 to-pink-600',
          'text-white',
          'shadow-lg shadow-purple-500/25',
        ],
        conversion: [
          'bg-gradient-to-br from-amber-500 to-orange-600',
          'text-white',
          'shadow-lg shadow-amber-500/25',
        ],
        neutral: [
          'bg-white dark:bg-surface-900/80',
          'border border-surface-200/50 dark:border-white/[0.06]',
          'hover:shadow-xl hover:-translate-y-1',
        ],
      },
    },
    defaultVariants: {
      intent: 'neutral',
    },
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(amountInCents: number, currency: Currency = 'USD'): string {
  const config = CURRENCY_CONFIG[currency];
  const amount = amountInCents / 100;

  if (amount >= 1000000) {
    return `${config.symbol}${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${config.symbol}${(amount / 1000).toFixed(1)}K`;
  }
  return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value}%`;
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface MetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  intent,
  className,
}) => {
  const isHero = intent !== 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(metricCardVariants({ intent }), className)}
    >
      {/* Background decoration for hero cards */}
      {isHero && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -end-1/2 w-full h-full bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 -start-1/4 w-1/2 h-1/2 bg-black/10 rounded-full blur-2xl" />
        </div>
      )}

      <div className="relative z-dropdown">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              isHero
                ? 'bg-white/20 backdrop-blur-sm'
                : 'bg-gradient-to-br from-surface-100 to-surface-200 dark:from-surface-800 dark:to-surface-700'
            )}
          >
            <Icon
              className={cn(
                'w-6 h-6',
                isHero ? 'text-white' : 'text-surface-600 dark:text-surface-300'
              )}
            />
          </div>

          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                isHero
                  ? 'bg-white/20 backdrop-blur-sm'
                  : trend.positive
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
              )}
            >
              {trend.positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {formatPercent(trend.value)}
            </div>
          )}
        </div>

        <p
          className={cn(
            'text-xs font-bold uppercase tracking-widest mb-1',
            isHero ? 'text-white/70' : 'text-surface-500 dark:text-surface-400'
          )}
        >
          {title}
        </p>

        <p
          className={cn(
            'text-3xl font-black tracking-tight',
            isHero ? 'text-white' : 'text-surface-900 dark:text-white'
          )}
        >
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>

        {subtitle && (
          <p
            className={cn(
              'text-sm mt-1',
              isHero ? 'text-white/60' : 'text-surface-500 dark:text-surface-400'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Mini stat for compact displays
interface MiniStatProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, icon: Icon, color = 'blue' }) => {
  const colorClasses: Record<string, string> = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20',
    green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/20',
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colorClasses[color])}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-lg font-black text-surface-900 dark:text-white">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
      </div>
    </div>
  );
};

// Revenue bar for monthly chart
interface RevenueBarProps {
  month: string;
  revenue: number;
  maxRevenue: number;
  currency: Currency;
  index: number;
}

const RevenueBar: React.FC<RevenueBarProps> = ({ month, revenue, maxRevenue, currency, index }) => {
  const heightPercent = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' });

  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex flex-col items-center gap-2 flex-1"
      style={{ transformOrigin: 'bottom' }}
    >
      <div className="relative w-full h-32 flex items-end">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${heightPercent}%` }}
          transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
          className={cn(
            'w-full rounded-t-lg min-h-[4px]',
            'bg-gradient-to-t from-blue-500 to-blue-400',
            'shadow-sm shadow-blue-500/30'
          )}
        />
      </div>
      <p className="text-xs font-bold text-surface-500 dark:text-surface-400">{monthLabel}</p>
      <p className="text-xs font-bold text-surface-900 dark:text-white">
        {formatCurrency(revenue, currency)}
      </p>
    </motion.div>
  );
};

// Top client row
interface TopClientRowProps {
  rank: number;
  name: string;
  revenue: number;
  deals: number;
  currency: Currency;
}

const TopClientRow: React.FC<TopClientRowProps> = ({ rank, name, revenue, deals, currency }) => {
  const rankColors: Record<number, string> = {
    1: 'text-amber-500 bg-amber-100 dark:bg-amber-500/20',
    2: 'text-surface-400 bg-surface-100 dark:bg-surface-500/20',
    3: 'text-orange-600 bg-orange-100 dark:bg-orange-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.1 }}
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm',
          rankColors[rank] || 'text-surface-500 bg-surface-100 dark:bg-surface-800'
        )}
      >
        {rank <= 3 ? <Crown className="w-4 h-4" /> : rank}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-surface-900 dark:text-white truncate">{name}</p>
        <p className="text-xs text-surface-500 dark:text-surface-400">
          {deals} deal{deals !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="text-end">
        <p className="font-black text-surface-900 dark:text-white">
          {formatCurrency(revenue, currency)}
        </p>
      </div>

      <ArrowUpRight className="w-4 h-4 text-surface-300 group-hover:text-blue-500 transition-colors" />
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface SalesPerformanceProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const SalesPerformance: React.FC<SalesPerformanceProps> = ({
  className,
  variant = 'full',
}) => {
  const t = useTranslations('portal');
  const { metrics, loading: metricsLoading } = useSalesMetrics();
  const { monthlyData, loading: monthlyLoading } = useMonthlyRevenue(6);
  const { topClients, loading: clientsLoading } = useTopClients(5);

  const loading = metricsLoading || monthlyLoading || clientsLoading;

  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <PortalSkeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortalSkeleton className="h-64 rounded-2xl" />
          <PortalSkeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const maxMonthlyRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t('sales.metrics.totalRevenue')}
          value={formatCurrency(metrics.totalRevenue, metrics.primaryCurrency)}
          subtitle={t('sales.metrics.allTime')}
          icon={DollarSign}
          intent="revenue"
        />

        <MetricCard
          title={t('sales.metrics.thisMonth')}
          value={formatCurrency(metrics.revenueThisMonth, metrics.primaryCurrency)}
          trend={
            metrics.revenueGrowth !== 0
              ? {
                  value: metrics.revenueGrowth,
                  positive: metrics.revenueGrowth > 0,
                }
              : undefined
          }
          icon={TrendingUp}
          intent="growth"
        />

        <MetricCard
          title={t('sales.metrics.activeClients')}
          value={metrics.activeClients}
          subtitle={`${metrics.totalClients} ${t('sales.metrics.total')}`}
          icon={Users}
          intent="clients"
        />

        <MetricCard
          title={t('sales.metrics.conversionRate')}
          value={`${metrics.conversionRate}%`}
          subtitle={`${metrics.paidProposals}/${metrics.totalProposals} ${t('sales.metrics.proposals')}`}
          icon={Target}
          intent="conversion"
        />
      </div>

      {/* Full variant shows additional sections */}
      {variant === 'full' && (
        <>
          {/* Secondary Metrics */}
          <Card variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white">
                  {t('sales.performance.title')}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t('sales.performance.subtitle')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <MiniStat
                label={t('sales.metrics.pendingRevenue')}
                value={formatCurrency(metrics.pendingRevenue, metrics.primaryCurrency)}
                icon={Clock}
                color="amber"
              />
              <MiniStat
                label={t('sales.metrics.avgDealSize')}
                value={formatCurrency(metrics.avgDealSize, metrics.primaryCurrency)}
                icon={Zap}
                color="purple"
              />
              <MiniStat
                label={t('sales.metrics.newClients')}
                value={metrics.newClientsThisMonth}
                icon={Sparkles}
                color="green"
              />
              <MiniStat
                label={t('sales.metrics.avgCloseTime')}
                value={`${metrics.avgTimeToClose}d`}
                icon={Clock}
                color="blue"
              />
            </div>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Revenue Chart */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">
                      {t('sales.chart.monthlyRevenue')}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {t('sales.chart.last6Months')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-end gap-2 h-48">
                {monthlyData.map((data, index) => (
                  <RevenueBar
                    key={data.month}
                    month={data.month}
                    revenue={data.revenue}
                    maxRevenue={maxMonthlyRevenue}
                    currency={metrics.primaryCurrency}
                    index={index}
                  />
                ))}
              </div>
            </Card>

            {/* Top Clients */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">
                      {t('sales.topClients.title')}
                    </h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {t('sales.topClients.subtitle')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                {topClients.length > 0 ? (
                  topClients.map((client, index) => (
                    <TopClientRow
                      key={client.orgId}
                      rank={index + 1}
                      name={client.orgName}
                      revenue={client.totalRevenue}
                      deals={client.dealCount}
                      currency={client.currency}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-surface-500 dark:text-surface-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">{t('sales.topClients.noData')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Proposal Stats */}
          <Card variant="default" padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white">
                  {t('sales.proposals.title')}
                </h3>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {t('sales.proposals.subtitle')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50">
                <p className="text-2xl font-black text-surface-900 dark:text-white">
                  <AnimatedNumber value={metrics.totalProposals} />
                </p>
                <p className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider mt-1">
                  {t('sales.proposals.total')}
                </p>
              </div>

              <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  <AnimatedNumber value={metrics.proposalsThisMonth} />
                </p>
                <p className="text-xs font-bold text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider mt-1">
                  {t('sales.proposals.thisMonth')}
                </p>
              </div>

              <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                  <AnimatedNumber value={metrics.acceptedProposals} />
                </p>
                <p className="text-xs font-bold text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider mt-1">
                  {t('sales.proposals.accepted')}
                </p>
              </div>

              <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  <AnimatedNumber value={metrics.paidProposals} />
                </p>
                <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider mt-1">
                  {t('sales.proposals.paid')}
                </p>
              </div>

              <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-500/10">
                <p className="text-2xl font-black text-red-600 dark:text-red-400">
                  <AnimatedNumber value={metrics.declinedProposals} />
                </p>
                <p className="text-xs font-bold text-red-600/70 dark:text-red-400/70 uppercase tracking-wider mt-1">
                  {t('sales.proposals.declined')}
                </p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default SalesPerformance;
