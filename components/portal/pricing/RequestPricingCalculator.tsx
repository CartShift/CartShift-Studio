'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import {
  Sparkles,
  Bug,
  Zap,
  FileText,
  Palette,
  HelpCircle,
  Clock,
  Flame,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Package,
  Calculator,
  AlertCircle,
  RotateCcw,
  Plus,
  X,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { PortalCard } from '@/components/portal/ui/PortalCard';
import { PortalButton } from '@/components/portal/ui/PortalButton';
import { PortalBadge } from '@/components/portal/ui/PortalBadge';
import { Request, RequestType, Currency } from '@/lib/types/portal';
import { CURRENCY_CONFIG } from '@/lib/types/pricing';
import { EffortLevel, EFFORT_LEVEL, EFFORT_LEVEL_CONFIG } from '@/lib/types/pricing-calculator';
import { calculatePricing, formatCalculatorPrice } from '@/lib/services/pricing-calculator';

// Icon mapping for request types
const TYPE_ICONS: Record<RequestType, React.ElementType> = {
  feature: Sparkles,
  bug: Bug,
  optimization: Zap,
  content: FileText,
  design: Palette,
  other: HelpCircle,
};

// Colors for request type pills
const TYPE_COLORS: Record<RequestType, { bg: string; text: string; border: string }> = {
  feature: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200 dark:border-violet-800',
  },
  bug: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  optimization: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  content: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  design: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-200 dark:border-pink-800',
  },
  other: {
    bg: 'bg-surface-100 dark:bg-surface-800',
    text: 'text-surface-700 dark:text-surface-300',
    border: 'border-surface-200 dark:border-surface-700',
  },
};

// Pricing configuration for a single request
export interface RequestPricingConfig {
  requestId: string;
  effortLevel: EffortLevel;
  isUrgent: boolean;
  isRecurringClient: boolean;
  customPrice?: number; // Override calculated price (in cents)
  notes?: string;
}

// Calculated result for a request
export interface RequestPricingResult {
  requestId: string;
  request: Request;
  config: RequestPricingConfig;
  basePrice: number;
  adjustedPrice: number;
  estimatedHours: { min: number; max: number };
}

export interface LineItemOutput {
  description: string;
  quantity: number;
  unitPrice: number; // In dollars for form
  requestId?: string;
  notes?: string;
}

interface RequestPricingCalculatorProps {
  /** Available requests to select from */
  availableRequests: Request[];
  /** Currently selected request IDs */
  selectedRequestIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void;
  /** Callback when line items are ready */
  onLineItemsChange: (items: LineItemOutput[]) => void;
  /** Currency for calculations */
  currency: Currency;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Callback to open quick add request modal/form */
  onQuickAddRequest?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Request Pricing Calculator - A comprehensive component that allows agency users
 * to select requests and configure individual pricing for each.
 *
 * Product Flow:
 * 1. User selects requests from available list
 * 2. Each selected request can be individually configured with effort level and modifiers
 * 3. Pricing is calculated per-request with a summary total
 * 4. Line items are generated automatically for the pricing form
 */
export function RequestPricingCalculator({
  availableRequests,
  selectedRequestIds,
  onSelectionChange,
  onLineItemsChange,
  currency,
  isLoading = false,
  error = null,
  onQuickAddRequest,
  className,
}: RequestPricingCalculatorProps) {
  const t = useTranslations();
  const locale = useLocale();
  const isRTL = locale === 'he';

  // Pricing configuration per request
  const [pricingConfigs, setPricingConfigs] = useState<Record<string, RequestPricingConfig>>({});

  // Expanded state for individual request cards
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  // Global modifiers that apply to all requests
  const [globalUrgent, setGlobalUrgent] = useState(false);
  const [globalRecurring, setGlobalRecurring] = useState(false);

  const effortLevels: EffortLevel[] = ['low', 'medium', 'high', 'complex'];

  // Initialize pricing config when a request is selected
  useEffect(() => {
    const newConfigs = { ...pricingConfigs };
    let hasChanges = false;

    selectedRequestIds.forEach(id => {
      if (!newConfigs[id]) {
        const request = availableRequests.find(r => r.id === id);
        newConfigs[id] = {
          requestId: id,
          effortLevel: EFFORT_LEVEL.MEDIUM,
          isUrgent: globalUrgent || request?.priority === 'URGENT',
          isRecurringClient: globalRecurring,
        };
        hasChanges = true;
      }
    });

    // Clean up removed requests
    Object.keys(newConfigs).forEach(id => {
      if (!selectedRequestIds.includes(id)) {
        delete newConfigs[id];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setPricingConfigs(newConfigs);
    }
  }, [selectedRequestIds, availableRequests, globalUrgent, globalRecurring]);

  // Calculate pricing results for all selected requests
  const pricingResults: RequestPricingResult[] = useMemo(() => {
    return selectedRequestIds
      .map(id => {
        const request = availableRequests.find(r => r.id === id);
        const config = pricingConfigs[id];

        if (!request || !config) return null;

        const result = calculatePricing({
          requestType: request.type,
          effortLevel: config.effortLevel,
          currency,
          modifiers: {
            isUrgent: config.isUrgent,
            isRecurringClient: config.isRecurringClient,
          },
        });

        return {
          requestId: id,
          request,
          config,
          basePrice: result.basePrice,
          adjustedPrice: config.customPrice ?? result.adjustedPrice,
          estimatedHours: result.estimatedHours,
        };
      })
      .filter((r): r is RequestPricingResult => r !== null);
  }, [selectedRequestIds, availableRequests, pricingConfigs, currency]);

  // Generate line items when pricing changes
  useEffect(() => {
    const lineItems: LineItemOutput[] = pricingResults.map(result => ({
      description: `${result.request.title} (${t(`portal.requests.types.${result.request.type}`)})`,
      quantity: 1,
      unitPrice: result.adjustedPrice / 100, // Convert cents to dollars
      requestId: result.requestId,
      notes: result.config.notes,
    }));

    onLineItemsChange(lineItems);
  }, [pricingResults, t, onLineItemsChange]);

  // Update config for a specific request
  const updateConfig = useCallback((requestId: string, updates: Partial<RequestPricingConfig>) => {
    setPricingConfigs(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        ...updates,
      },
    }));
  }, []);

  // Toggle request selection
  const toggleRequest = useCallback(
    (requestId: string) => {
      if (selectedRequestIds.includes(requestId)) {
        onSelectionChange(selectedRequestIds.filter(id => id !== requestId));
      } else {
        onSelectionChange([...selectedRequestIds, requestId]);
        // Auto-expand when selecting
        setExpandedRequests(prev => new Set([...prev, requestId]));
      }
    },
    [selectedRequestIds, onSelectionChange]
  );

  // Toggle expanded state
  const toggleExpanded = useCallback((requestId: string) => {
    setExpandedRequests(prev => {
      const next = new Set(prev);
      if (next.has(requestId)) {
        next.delete(requestId);
      } else {
        next.add(requestId);
      }
      return next;
    });
  }, []);

  // Apply global modifiers to all
  const applyGlobalModifiers = useCallback(() => {
    setPricingConfigs(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(id => {
        updated[id] = {
          ...updated[id],
          isUrgent: globalUrgent,
          isRecurringClient: globalRecurring,
        };
      });
      return updated;
    });
  }, [globalUrgent, globalRecurring]);

  // Render effort level selector
  const renderEffortSelector = (requestId: string, currentLevel: EffortLevel) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {effortLevels.map(level => {
        const config = EFFORT_LEVEL_CONFIG[level];
        const isSelected = currentLevel === level;

        return (
          <button
            key={level}
            type="button"
            onClick={() => updateConfig(requestId, { effortLevel: level })}
            aria-pressed={isSelected}
            className={cn(
              'p-3 rounded-xl border-2 transition-all text-start',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500',
              isSelected
                ? cn(config.bgColor, 'border-current', config.color, 'shadow-sm')
                : 'bg-white dark:bg-surface-900 border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
            )}
          >
            <div
              className={cn(
                'font-bold text-sm',
                isSelected ? config.color : 'text-surface-900 dark:text-white'
              )}
            >
              {isRTL ? config.labelHe : config.label}
            </div>
            <div className="text-[10px] text-surface-500 dark:text-surface-400 flex items-center gap-1 mt-1">
              <Clock size={10} />
              {isRTL ? config.hoursRangeHe : config.hoursRange}
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Global Settings */}
      <PortalCard className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 sm:me-auto">
            <div className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <Calculator size={16} className="text-surface-500" />
            </div>
            <span className="text-sm font-bold text-surface-700 dark:text-surface-300">
              {t('portal.pricing.globalModifiers' as never)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Global Urgent */}
            <button
              type="button"
              onClick={() => setGlobalUrgent(!globalUrgent)}
              aria-pressed={globalUrgent}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-500',
                globalUrgent
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                  : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              <Flame size={14} />
              {t('portal.pricing.modifiers.urgent')}
            </button>

            {/* Global Recurring */}
            <button
              type="button"
              onClick={() => setGlobalRecurring(!globalRecurring)}
              aria-pressed={globalRecurring}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500',
                globalRecurring
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300'
                  : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
              )}
            >
              <Users size={14} />
              {t('portal.pricing.modifiers.recurring')}
            </button>

            {selectedRequestIds.length > 0 && (
              <PortalButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={applyGlobalModifiers}
              >
                {t('portal.pricing.applyToAll' as never)}
              </PortalButton>
            )}
          </div>
        </div>
      </PortalCard>

      {/* Available Requests */}
      <PortalCard padding="none" className="overflow-hidden">
        <div className="p-4 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 dark:text-white font-outfit">
                  {t('portal.pricing.selectAndPrice' as never)}
                </h3>
                <p className="text-xs text-surface-500">
                  {t('portal.pricing.selectAndPriceDesc' as never)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedRequestIds.length > 0 && (
                <PortalBadge variant="blue">
                  {selectedRequestIds.length} {t('portal.pricing.form.selected')}
                </PortalBadge>
              )}
              {onQuickAddRequest && (
                <PortalButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onQuickAddRequest}
                  className="gap-1.5"
                >
                  <Plus size={14} />
                  {t('portal.pricing.quickAddRequest' as never) || 'Quick Add'}
                </PortalButton>
              )}
            </div>
          </div>
        </div>

        <div className="divide-y divide-surface-100 dark:divide-surface-800">
          {isLoading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : availableRequests.length === 0 ? (
            <div className="p-8 text-center text-surface-500">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{t('portal.pricing.form.noRequestsAvailable')}</p>
            </div>
          ) : (
            availableRequests.map(request => {
              const isSelected = selectedRequestIds.includes(request.id);
              const isExpanded = expandedRequests.has(request.id);
              const config = pricingConfigs[request.id];
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
                    className={cn(
                      'p-4 flex items-start gap-3 sm:gap-4 cursor-pointer transition-colors',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-900/10'
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
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-surface-300 dark:border-surface-600'
                      )}
                    >
                      {isSelected && <Check size={14} />}
                    </div>

                    {/* Request Type Icon */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
                        colors.bg,
                        colors.text
                      )}
                    >
                      <Icon size={18} />
                    </div>

                    {/* Request Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-surface-900 dark:text-white truncate text-sm sm:text-base">
                          {request.title}
                        </h4>
                        <PortalBadge variant="gray" size="sm">
                          {t(`portal.requests.types.${request.type}`)}
                        </PortalBadge>
                        {request.priority === 'URGENT' && (
                          <PortalBadge variant="red" size="sm">
                            <Flame size={10} className="me-0.5" />
                            {t('portal.requests.priority.urgent')}
                          </PortalBadge>
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
                        <div className="text-lg font-black text-blue-600 dark:text-blue-400 font-outfit">
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
                          aria-label={isExpanded ? t('portal.common.collapse' as never) : t('portal.common.expand' as never)}
                          onClick={e => {
                            e.stopPropagation();
                            toggleExpanded(request.id);
                          }}
                          className={cn(
                            'p-2 rounded-lg transition-colors',
                            'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300',
                            'hover:bg-surface-100 dark:hover:bg-surface-800',
                            'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500'
                          )}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {/* Remove Button */}
                        <button
                          type="button"
                          aria-label={t('portal.common.delete')}
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

                  {/* Expanded Configuration Panel */}
                  <AnimatePresence>
                    {isSelected && isExpanded && config && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden bg-blue-50/30 dark:bg-blue-900/5"
                      >
                        <div className="px-4 pb-4 ps-10 sm:ps-16 pe-4 space-y-4 border-t border-surface-100 dark:border-surface-800 pt-4">
                          {/* Effort Level */}
                          <div className="space-y-2">
                            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">
                              {t('portal.pricing.effortLevel')}
                            </label>
                            {renderEffortSelector(request.id, config.effortLevel)}
                          </div>

                          {/* Price Override */}
                          {result && (
                            <div className="space-y-3">
                              {/* Custom Price Input */}
                              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                                <div className="flex-1">
                                  <label className="text-xs font-black text-surface-500 uppercase tracking-widest mb-2 block">
                                    {t('portal.pricing.customPrice' as never) || 'Custom Price'}
                                  </label>
                                  <div className="relative">
                                    <span className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm font-medium">
                                      {CURRENCY_CONFIG[currency]?.symbol || '$'}
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      value={config.customPrice !== undefined ? config.customPrice / 100 : result.adjustedPrice / 100}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || value === undefined) {
                                          updateConfig(request.id, { customPrice: undefined });
                                        } else {
                                          updateConfig(request.id, { customPrice: Math.round(parseFloat(value) * 100) });
                                        }
                                      }}
                                      className={cn(
                                        'portal-input w-full ps-8 text-lg font-bold',
                                        config.customPrice !== undefined && 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/20'
                                      )}
                                      placeholder={String(result.adjustedPrice / 100)}
                                    />
                                  </div>
                                </div>
                                {config.customPrice !== undefined && (
                                  <button
                                    type="button"
                                    onClick={() => updateConfig(request.id, { customPrice: undefined })}
                                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-xl border border-amber-200 dark:border-amber-800 transition-colors"
                                  >
                                    <RotateCcw size={14} />
                                    {t('portal.pricing.resetToCalculated' as never) || 'Reset'}
                                  </button>
                                )}
                              </div>

                              {/* Price Summary */}
                              <div className={cn(
                                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border',
                                config.customPrice !== undefined
                                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50 dark:border-amber-800/30'
                                  : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200/50 dark:border-emerald-800/30'
                              )}>
                                <div>
                                  <div className={cn(
                                    'text-xs font-black uppercase tracking-widest mb-1',
                                    config.customPrice !== undefined
                                      ? 'text-amber-600/70 dark:text-amber-400/70'
                                      : 'text-emerald-600/70 dark:text-emerald-400/70'
                                  )}>
                                    {config.customPrice !== undefined
                                      ? (t('portal.pricing.overriddenPrice' as never) || 'Overridden Price')
                                      : t('portal.pricing.itemPrice')}
                                  </div>
                                  <div className={cn(
                                    'text-2xl font-black font-outfit',
                                    config.customPrice !== undefined
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-emerald-700 dark:text-emerald-400'
                                  )}>
                                    {formatCalculatorPrice(result.adjustedPrice, currency)}
                                  </div>
                                  {config.customPrice !== undefined && (
                                    <div className="text-xs text-surface-500 mt-1 line-through">
                                      {t('portal.pricing.calculatedPrice' as never) || 'Calculated'}: {formatCalculatorPrice(result.basePrice, currency)}
                                    </div>
                                  )}
                                </div>
                                <div className="text-start sm:text-end text-xs text-surface-600 dark:text-surface-400">
                                  <div className="text-surface-500">{t('portal.common.estimated')}</div>
                                  <div className="font-bold text-sm">
                                    {result.estimatedHours.min}-{result.estimatedHours.max}{' '}
                                    {t('portal.common.hours')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </PortalCard>
    </div>
  );
}
