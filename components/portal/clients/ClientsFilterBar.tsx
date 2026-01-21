'use client';

import { useTranslations } from 'next-intl';
import { Search, Filter, LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface ClientsFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  showMyClientsOnly: boolean;
  onToggleMyClients: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  activeCount: number;
}

export function ClientsFilterBar({
  searchQuery,
  onSearchChange,
  showMyClientsOnly,
  onToggleMyClients,
  viewMode,
  onViewModeChange,
  activeCount,
}: ClientsFilterBarProps) {
  const t = useTranslations('portal');

  return (
    <div className="bg-white dark:bg-surface-900/50 p-4 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400" size={18} />
        <Input
          type="text"
          placeholder={t('agency.clients.searchPlaceholder')}
          className="ps-10 h-10 bg-surface-50 dark:bg-surface-900/50 border-surface-200 dark:border-surface-700 focus:ring-blue-500" // using Input component directly or native input with styles?
          // The previous code used native input with 'portal-input' class. Let's stick to standard Input component or similar styling.
          // Using standard Input component which usually has className prop.
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-[10px] font-black text-surface-400 uppercase tracking-widest px-2 whitespace-nowrap">
            {activeCount} {t('agency.clients.activeAccounts')}
          </div>

          {/* Filter Button */}
          <Button
            variant={showMyClientsOnly ? 'primary' : 'outline'}
            size="sm"
            onClick={onToggleMyClients}
            className={cn(
              'h-10 transition-all font-medium',
              !showMyClientsOnly && 'border-surface-200 dark:border-surface-800 text-surface-500'
            )}
          >
            <Filter size={16} className="me-2" />
            <span className="hidden sm:inline">{t('agency.clients.filter.myClients' as any)}</span>
            <span className="sm:hidden">{t('common.filter')}</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-surface-100 dark:bg-surface-800 p-1 rounded-lg border border-surface-200 dark:border-surface-700">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-surface-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
              )}
              aria-label="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'p-1.5 rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-white dark:bg-surface-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300'
              )}
              aria-label="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Add Client Button (Mobile sometimes helpful here, but typically in header) */}
        <div className="md:hidden">
          <Link href="/portal/agency/clients/new/">
            <Button
              size="sm"
              className="h-10 w-10 p-0 rounded-full flex items-center justify-center"
            >
              <Plus size={20} />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
