'use client';

import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RequestDetailTab = 'overview' | 'discussion' | 'history';

interface RequestDetailTabBarProps {
  activeTab: RequestDetailTab;
  onTabChange: (tab: RequestDetailTab) => void;
  commentCount: number;
  overviewLabel: string;
  discussionLabel: string;
  historyLabel: string;
}

export function RequestDetailTabBar({
  activeTab,
  onTabChange,
  commentCount,
  overviewLabel,
  discussionLabel,
  historyLabel,
}: RequestDetailTabBarProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-900 rounded-2xl w-full overflow-x-auto scrollbar-hide">
      <button
        type="button"
        onClick={() => onTabChange('overview')}
        aria-pressed={activeTab === 'overview'}
        className={cn(
          'portal-focus-ring px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all font-outfit touch-manipulation whitespace-nowrap outline-none',
          activeTab === 'overview'
            ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        )}
      >
        {overviewLabel}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('discussion')}
        aria-pressed={activeTab === 'discussion'}
        className={cn(
          'portal-focus-ring px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all font-outfit touch-manipulation flex items-center gap-2 whitespace-nowrap outline-none',
          activeTab === 'discussion'
            ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        )}
      >
        {discussionLabel}
        {commentCount > 0 && (
          <span className="bg-primary-100 dark:bg-primary-900 text-primary-600 px-1.5 py-0.5 rounded-md text-[10px]">
            {commentCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('history')}
        aria-pressed={activeTab === 'history'}
        className={cn(
          'portal-focus-ring px-4 sm:px-6 py-3 min-h-[44px] rounded-xl text-sm font-bold transition-all font-outfit touch-manipulation flex items-center gap-2 whitespace-nowrap outline-none',
          activeTab === 'history'
            ? 'bg-white dark:bg-surface-800 text-primary-600 shadow-sm'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
        )}
      >
        <Clock size={16} />
        {historyLabel}
      </button>
    </div>
  );
}
