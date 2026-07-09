'use client';

import { usePortalTranslations } from '@/lib/i18n/translations';
import { Package, Check, Flame, Plus, ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Request } from '@/lib/types/portal';
import { TYPE_ICONS, TYPE_COLORS, type RequestPricingResult } from './RequestPricingCalculator';
import { formatCalculatorPrice } from '@/lib/services/pricing-calculator';
import { Currency } from '@/lib/types/portal';

interface RequestSelectorProps {
  availableRequests: Request[];
  selectedRequestIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onToggleExpanded: (id: string) => void;
  onQuickAddRequest?: () => void;
  expandedRequests: Set<string>;
  pricingResults: RequestPricingResult[];
  currency: Currency;
  error?: string | null;
}

/**
 * RequestSelector component - Handles request selection and display
 * Follows AGENTS.md guidelines for accessibility and RTL support
 */
export function RequestSelector({
  availableRequests,
  selectedRequestIds,
  onSelectionChange,
  onToggleExpanded,
  onQuickAddRequest,
  expandedRequests,
  pricingResults,
  currency,
  error,
}: RequestSelectorProps) {
  const t = usePortalTranslations();

  const toggleRequest = (requestId: string) => {
    if (selectedRequestIds.includes(requestId)) {
      onSelectionChange(selectedRequestIds.filter(id => id !== requestId));
    } else {
      onSelectionChange([...selectedRequestIds, requestId]);
      // Auto-expand when selecting
      onToggleExpanded(requestId);
    }
  };

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-primary-50 dark:bg-primary-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white font-outfit">
                {t('pricing.selectAndPrice' as never)}
              </h3>
              <p className="text-xs text-surface-500">
                {t('pricing.selectAndPriceDesc' as never)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedRequestIds.length > 0 && (
              <Badge variant="blue">
                {selectedRequestIds.length}{' '}
                {selectedRequestIds.length === 1
                  ? t('pricing.form.selected_singular')
                  : t('pricing.form.selected')}
              </Badge>
            )}
            {onQuickAddRequest && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onQuickAddRequest}
                className="gap-1.5"
                aria-label={t('pricing.quickAddRequest')}
              >
                <Plus size={14} />
                {t('pricing.quickAddRequest' as never) || 'Quick Add'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-surface-100 dark:divide-surface-800">
        {error ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 text-red-500 flex items-center justify-center">
              {/* AlertCircle icon would be imported */}
              <span>⚠</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : availableRequests.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <div className="w-10 h-10 mx-auto mb-3 opacity-50 flex items-center justify-center">
              {/* FileText icon would be imported */}
              <span>📄</span>
            </div>
            <p className="font-medium">{t('pricing.form.noRequestsAvailable')}</p>
          </div>
        ) : (
          availableRequests.map(request => {
            const isSelected = selectedRequestIds.includes(request.id);
            const isExpanded = expandedRequests.has(request.id);
            const result = pricingResults.find(r => r.requestId === request.id);
            const Icon = TYPE_ICONS[request.type];
            const colors = TYPE_COLORS[request.type];

            return (
              <div key={request.id} className="transition-colors">
                {/* Request Header */}
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isSelected && isExpanded}
                  aria-selected={isSelected}
                  aria-label={`${request.title}, ${t(`requests.types.${request.type}`)}, ${request.priority === 'URGENT' ? 'Urgent priority' : ''}. ${isSelected ? 'Selected' : 'Not selected'}. ${isExpanded ? 'Configuration expanded' : 'Configuration collapsed'}`}
                  className={cn(
                    'p-4 flex items-start gap-3 sm:gap-4 cursor-pointer transition-colors',
                    'portal-focus-ring',
                    isSelected
                      ? 'bg-primary-50/50 dark:bg-primary-900/10'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-900/50'
                  )}
                  onClick={() => toggleRequest(request.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleRequest(request.id);
                    }
                  }}
                >
                  {/* Selection Checkbox */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5',
                      isSelected
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-surface-300 dark:border-surface-600'
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && <Check size={14} />}
                  </div>

                  {/* Request Type Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
                      colors
                    )}
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </div>

                  {/* Request Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-surface-900 dark:text-white truncate text-sm sm:text-base">
                        {request.title}
                      </h4>
                      <Badge variant="gray" size="sm">
                        {t(`requests.types.${request.type}`)}
                      </Badge>
                      {request.priority === 'URGENT' && (
                        <Badge variant="red" size="sm">
                          <Flame size={10} className="me-0.5" />
                          {t('requests.priority.urgent')}
                        </Badge>
                      )}
                    </div>
                    {request.description && (
                      <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1 line-clamp-2">
                        {request.description}
                      </p>
                    )}
                  </div>

                  {/* Price Preview (if selected) */}
                  {isSelected && result && (
                    <div className="flex-shrink-0 text-end hidden sm:block">
                      <div className="text-lg font-black text-primary-600 dark:text-primary-400 font-outfit">
                        {formatCalculatorPrice(result.adjustedPrice, currency)}
                      </div>
                      <div className="text-xs text-surface-500 dark:text-surface-400">
                        {result.estimatedHours.min}-{result.estimatedHours.max}h
                      </div>
                    </div>
                  )}

                  {/* Action Buttons (if selected) */}
                  {isSelected && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {/* Expand/Collapse Button */}
                      <button
                        type="button"
                        aria-label={
                          isExpanded ? t('common.collapse') : t('common.expand')
                        }
                        onClick={e => {
                          e.stopPropagation();
                          onToggleExpanded(request.id);
                        }}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300',
                          'hover:bg-surface-100 dark:hover:bg-surface-800',
                          'portal-focus-ring'
                        )}
                      >
                        {/* Chevron icons would be imported */}
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {/* Remove Button */}
                      <button
                        type="button"
                        aria-label={t('common.delete')}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectionChange(selectedRequestIds.filter(id => id !== request.id));
                        }}
                        className={cn(
                          'p-2 rounded-lg transition-colors',
                          'text-surface-400 hover:text-red-500',
                          'hover:bg-red-50 dark:hover:bg-red-900/20',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500'
                        )}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Expanded content will be rendered by parent component */}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
