'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Filter, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

export type ClientStatus = 'active' | 'inactive' | 'suspended' | 'all';
export type ClientPlan = 'enterprise' | 'pro' | 'free' | 'all';

interface ClientMultiFilterProps {
  statusFilter: ClientStatus[];
  planFilter: ClientPlan[];
  revenueRange: { min: number; max: number };
  onStatusChange: (statuses: ClientStatus[]) => void;
  onPlanChange: (plans: ClientPlan[]) => void;
  onRevenueRangeChange: (range: { min: number; max: number }) => void;
  onReset: () => void;
}

export function ClientMultiFilter({
  statusFilter,
  planFilter,
  revenueRange,
  onStatusChange,
  onPlanChange,
  onRevenueRangeChange,
  onReset,
}: ClientMultiFilterProps) {
  const t = useTranslations('portal');
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  const statusOptions: { value: ClientStatus; label: string }[] = [
    { value: 'active', label: t('agency.clients.badge.active') },
    { value: 'inactive', label: t('agency.clients.badge.inactive') },
    { value: 'suspended', label: t('agency.clients.badge.suspended') },
  ];

  const planOptions: { value: ClientPlan; label: string }[] = [
    { value: 'enterprise', label: t('agency.clients.plans.enterprise') },
    { value: 'pro', label: t('agency.clients.plans.pro') },
    { value: 'free', label: t('agency.clients.plans.free') },
  ];

  const hasActiveFilters =
    statusFilter.length > 0 ||
    planFilter.length > 0 ||
    revenueRange.min > 0 ||
    revenueRange.max < 10000000;

  const toggleStatus = (status: ClientStatus) => {
    if (statusFilter.includes(status)) {
      onStatusChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusChange([...statusFilter, status]);
    }
  };

  const togglePlan = (plan: ClientPlan) => {
    if (planFilter.includes(plan)) {
      onPlanChange(planFilter.filter(p => p !== plan));
    } else {
      onPlanChange([...planFilter, plan]);
    }
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        variant={hasActiveFilters ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-10 transition-all font-medium relative',
          !hasActiveFilters && 'border-surface-200 dark:border-surface-800 text-surface-500'
        )}
        aria-label={t('common.filters.title')}
        aria-expanded={isOpen}
      >
        <Filter size={16} className="me-2" aria-hidden="true" />
        <span className="hidden sm:inline">{t('common.filters.title')}</span>
        <span className="sm:hidden">{t('common.filter')}</span>
        {hasActiveFilters && (
          <span className="absolute -top-1 -end-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">
              {(statusFilter.length || 0) +
                (planFilter.length || 0) +
                (revenueRange.min > 0 || revenueRange.max < 10000000 ? 1 : 0)}
            </span>
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute start-0 top-full mt-2 w-80 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden z-dropdown p-4"
            style={{ transformOrigin: 'top start' }}
          >
            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <h4 className="portal-label-sm mb-3">
                  {t('common.filters.status')}
                </h4>
                <div className="space-y-2">
                  {statusOptions.map(option => {
                    const isSelected = statusFilter.includes(option.value);
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => toggleStatus(option.value)}
                        className={cn(
                          'portal-focus-ring w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all min-h-[44px]',
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                        )}
                      >
                        <span className="font-medium">{option.label}</span>
                        {isSelected && (
                          <Check size={16} className="text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Plan Filter */}
              <div>
                <h4 className="portal-label-sm mb-3">
                  {t('common.filters.plan')}
                </h4>
                <div className="space-y-2">
                  {planOptions.map(option => {
                    const isSelected = planFilter.includes(option.value);
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => togglePlan(option.value)}
                        className={cn(
                          'portal-focus-ring w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all min-h-[44px]',
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400'
                            : 'hover:bg-surface-50 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-300'
                        )}
                      >
                        <span className="font-medium">{option.label}</span>
                        {isSelected && (
                          <Check size={16} className="text-primary-600 dark:text-primary-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Revenue Range */}
              <div>
                <h4 className="portal-label-sm mb-3">
                  {t('common.filters.revenueRange')}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={revenueRange.min || ''}
                      onChange={e =>
                        onRevenueRangeChange({
                          min: parseInt(e.target.value) || 0,
                          max: revenueRange.max,
                        })
                      }
                      className="portal-input flex-1 rounded-lg h-10"
                      aria-label={t('common.filters.minRevenue')}
                    />
                    <span className="text-surface-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={revenueRange.max === 10000000 ? '' : revenueRange.max || ''}
                      onChange={e =>
                        onRevenueRangeChange({
                          min: revenueRange.min,
                          max: parseInt(e.target.value) || 10000000,
                        })
                      }
                      className="portal-input flex-1 rounded-lg h-10"
                      aria-label={t('common.filters.maxRevenue')}
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="w-full justify-center text-surface-500 hover:text-surface-900 dark:hover:text-white"
                >
                  <X size={16} className="me-2" aria-hidden="true" />
                  {t('common.filters.reset')}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
