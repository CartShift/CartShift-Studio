'use client';

import { BarChart3, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SalesDashboardTab = 'overview' | 'profit-splits';

interface SalesDashboardTabBarProps {
  activeTab: SalesDashboardTab;
  onTabChange: (tab: SalesDashboardTab) => void;
  overviewLabel: string;
  profitSplitsLabel: string;
  draftCount?: number;
}

export function SalesDashboardTabBar({
  activeTab,
  onTabChange,
  overviewLabel,
  profitSplitsLabel,
  draftCount = 0,
}: SalesDashboardTabBarProps) {
  return (
    <div
      className="flex w-full items-center gap-1 overflow-x-auto rounded-2xl bg-surface-100 p-1 scrollbar-hide dark:bg-surface-900"
      role="tablist"
      aria-label="Sales dashboard views"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'overview'}
        onClick={() => onTabChange('overview')}
        className={cn(
          'portal-focus-ring flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold font-outfit transition-all touch-manipulation outline-none sm:px-6',
          activeTab === 'overview'
            ? 'bg-white text-primary-600 shadow-sm dark:bg-surface-800'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        )}
      >
        <BarChart3 className="h-4 w-4" />
        {overviewLabel}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'profit-splits'}
        onClick={() => onTabChange('profit-splits')}
        className={cn(
          'portal-focus-ring flex min-h-[44px] items-center gap-2 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-bold font-outfit transition-all touch-manipulation outline-none sm:px-6',
          activeTab === 'profit-splits'
            ? 'bg-white text-primary-600 shadow-sm dark:bg-surface-800'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        )}
      >
        <PieChart className="h-4 w-4" />
        {profitSplitsLabel}
        {draftCount > 0 && (
          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
            {draftCount}
          </span>
        )}
      </button>
    </div>
  );
}
