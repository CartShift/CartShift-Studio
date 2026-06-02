'use client';

import { useTranslations } from 'next-intl';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import { CURRENCY_CONFIG, Currency } from '@/lib/types/portal';

interface RevenueSummaryProps {
  totalRevenue: number;
  activeClients: number;
  avgDealSize: number;
  currency?: Currency;
}

function formatRevenue(amountInCents: number, currency: Currency = 'USD'): string {
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

export function RevenueSummary({
  totalRevenue,
  activeClients,
  avgDealSize,
  currency = 'USD',
}: RevenueSummaryProps) {
  const t = useTranslations('portal');

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-sm">
      <div className="flex flex-1 items-center gap-6 w-full justify-between sm:justify-start">
        {/* Total Revenue */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="portal-label-sm text-[10px]">
              {t('sales.metrics.totalRevenue')}
            </p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">
              {formatRevenue(totalRevenue, currency)}
            </p>
          </div>
        </div>

        {/* Active Clients */}
        <div className="hidden sm:flex h-8 w-px bg-surface-200 dark:bg-surface-700" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Users size={20} />
          </div>
          <div>
            <p className="portal-label-sm text-[10px]">
              {t('sales.metrics.activeClients')}
            </p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">{activeClients}</p>
          </div>
        </div>

        {/* Avg Deal Size */}
        <div className="hidden sm:flex h-8 w-px bg-surface-200 dark:bg-surface-700" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-accent-600 dark:text-accent-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="portal-label-sm text-[10px]">
              {t('sales.metrics.avgDealSize')}
            </p>
            <p className="text-xl font-bold text-surface-900 dark:text-white">
              {formatRevenue(avgDealSize, currency)}
            </p>
          </div>
        </div>
      </div>

      {/* Link to Sales Dashboard (Optional/Future) */}
      {/* Could add a 'View Details' button here if needed */}
    </div>
  );
}
