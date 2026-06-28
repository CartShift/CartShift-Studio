import { useTranslations } from 'next-intl';
import { Search, Filter, SortAsc, CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

interface WorkboardFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showMyRequests: boolean;
  onToggleMyRequests: () => void;
  sortBy: 'date' | 'priority' | 'newest';
  onSortChange: (sort: 'date' | 'priority' | 'newest') => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  priorityFilter: string | null;
  onPriorityFilterChange: (priority: string | null) => void;
}

export function WorkboardFilterBar({
  searchQuery,
  onSearchChange,
  showMyRequests,
  onToggleMyRequests,
  sortBy,
  onSortChange,
  isSelectionMode,
  onToggleSelectionMode,
  priorityFilter,
  onPriorityFilterChange,
}: WorkboardFilterBarProps) {
  const t = useTranslations('portal');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full bg-white dark:bg-surface-900 p-1 rounded-2xl border border-surface-100 dark:border-surface-800 shadow-sm transition-all">
      {/* Search */}
      <div className="flex-1 w-full sm:min-w-[200px]">
        <Input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={t('common.search')}
          leftIcon={<Search className="text-surface-400 w-4 h-4" />}
          className="bg-transparent border-none shadow-none focus:ring-0 dark:shadow-none"
        />
      </div>

      <div className="h-6 w-px bg-surface-200 dark:bg-surface-800 hidden sm:block" />

      {/* Filters & Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide px-2 sm:px-0">
        {/* Selection Mode Toggle */}
        <Button
          size="sm"
          variant={isSelectionMode ? 'primary' : 'ghost'}
          onClick={onToggleSelectionMode}
          className={cn('whitespace-nowrap gap-2', !isSelectionMode && 'text-surface-500')}
          title="Bulk Actions"
        >
          {isSelectionMode ? <X size={14} /> : <CheckSquare size={14} />}
          <span className="hidden sm:inline">
            {isSelectionMode ? t('common.cancel') : t('common.select')}
          </span>
        </Button>

        <div className="h-4 w-px bg-surface-200 dark:bg-surface-800 mx-1" />

        {/* My Requests Filter */}
        <Button
          size="sm"
          variant={showMyRequests ? 'primary' : 'ghost'}
          onClick={onToggleMyRequests}
          className={cn('whitespace-nowrap gap-2', !showMyRequests && 'text-surface-500')}
        >
          <Filter size={14} />
          {t('agency.workboard.filter.myRequests')}
        </Button>

        {/* Priority Filter */}
        <Dropdown
          trigger={
            <span
              className={cn(
                'portal-focus-ring inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer',
                priorityFilter
                  ? 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-white'
                  : 'text-surface-500 hover:text-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800'
              )}
            >
              {t('requests.field.priority')}
              {priorityFilter && (
                <span className="bg-surface-200 dark:bg-surface-700 px-1.5 rounded text-[10px]">
                  {priorityFilter}
                </span>
              )}
            </span>
          }
          items={[
            {
              label: t('common.all'),
              onClick: () => onPriorityFilterChange(null),
              active: priorityFilter === null,
            },
            {
              label: t('requests.priority.urgent'),
              onClick: () => onPriorityFilterChange('URGENT'),
              active: priorityFilter === 'URGENT',
            },
            {
              label: t('requests.priority.high'),
              onClick: () => onPriorityFilterChange('HIGH'),
              active: priorityFilter === 'HIGH',
            },
            {
              label: t('requests.priority.normal'),
              onClick: () => onPriorityFilterChange('NORMAL'),
              active: priorityFilter === 'NORMAL',
            },
            {
              label: t('requests.priority.low'),
              onClick: () => onPriorityFilterChange('LOW'),
              active: priorityFilter === 'LOW',
            },
          ]}
        />

        {/* Sort */}
        <Dropdown
          trigger={
            <span className="portal-focus-ring inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
              <SortAsc size={14} />
            </span>
          }
          items={[
            {
              label: t('workboard.filters.newest'),
              onClick: () => onSortChange('newest'),
              active: sortBy === 'newest',
            },
            {
              label: t('workboard.filters.priority'),
              onClick: () => onSortChange('priority'),
              active: sortBy === 'priority',
            },
          ]}
        />
      </div>
    </div>
  );
}
