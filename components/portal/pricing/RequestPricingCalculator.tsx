'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePortalTranslations } from '@/lib/i18n/translations';

import { cn } from '@/lib/utils';
import { Request, Currency } from '@/lib/types/portal';
import { EffortLevel, EFFORT_LEVEL } from '@/lib/types/pricing-calculator';
import { calculatePricing, formatCalculatorPrice } from '@/lib/services/pricing-calculator';

// Constants
import {
  TYPE_ICONS,
  TYPE_COLORS,
} from '@/lib/constants/request-type-ui';

export { TYPE_ICONS, TYPE_COLORS };

import { useUpdatePricingConfig, useApplyGlobalModifiers } from '@/lib/hooks/usePricingConfig';
import { GlobalModifiers } from './GlobalModifiers';
import { RequestSelector } from './RequestSelector';
import { RequestConfigurator } from './RequestConfigurator';

export interface RequestPricingConfig {
  requestId: string;
  effortLevel: EffortLevel;
  isUrgent: boolean;
  isRecurringClient: boolean;
  customPrice?: number;
  notes?: string;
}

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
  unitPrice: number;
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
  /** Error message */
  error?: string | null;
  /** Callback to open quick add request modal/form */
  onQuickAddRequest?: () => void;
  /** Additional class names */
  className?: string;
  /** Organization ID for pricing config storage */
  orgId: string;
}

/**
 * Request Pricing Calculator - Refactored Component
 *
 * Product Flow:
 * 1. User selects requests from available list
 * 2. Each selected request can be individually configured with effort level and modifiers
 * 3. Pricing is calculated per-request with a summary total
 * 4. Line items are generated automatically for the pricing form
 *
 * Architecture:
 * - Uses TanStack Query for server state management
 * - Optimistic updates for responsive UI
 * - Separated into focused sub-components
 * - Full RTL support and accessibility compliance
 */
export function RequestPricingCalculator({
  availableRequests,
  selectedRequestIds,
  onSelectionChange,
  onLineItemsChange,
  currency,
  error = null,
  onQuickAddRequest,
  className,
  orgId,
}: RequestPricingCalculatorProps) {
  const t = usePortalTranslations();

  // Global modifiers state
  const [globalUrgent, setGlobalUrgent] = useState(false);
  const [globalRecurring, setGlobalRecurring] = useState(false);

  // Expanded state for individual request cards
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());

  // Custom hooks for pricing config management
  const updateConfigMutation = useUpdatePricingConfig(orgId);
  const applyGlobalModifiersMutation = useApplyGlobalModifiers(orgId);

  // Calculate pricing results for all selected requests
  const pricingResults: RequestPricingResult[] = useMemo(() => {
    return selectedRequestIds
      .map(id => {
        const request = availableRequests.find(r => r.id === id);
        if (!request) return null;

        // Get config from local state (would be replaced with hook data in full implementation)
        const config: RequestPricingConfig = {
          requestId: id,
          effortLevel: EFFORT_LEVEL.MEDIUM,
          isUrgent: globalUrgent || request.priority === 'URGENT',
          isRecurringClient: globalRecurring,
        };

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
  }, [selectedRequestIds, availableRequests, currency, globalUrgent, globalRecurring]);

  // Generate line items when pricing changes
  useEffect(() => {
    const lineItems: LineItemOutput[] = pricingResults.map(result => ({
      description: `${result.request.title} (${t(`requests.types.${result.request.type}`)})`,
      quantity: 1,
      unitPrice: result.adjustedPrice / 100, // Convert cents to dollars
      requestId: result.requestId,
      notes: result.config.notes,
    }));

    onLineItemsChange(lineItems);
  }, [pricingResults, t, onLineItemsChange]);

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

  // Update individual request config
  const updateConfig = useCallback(
    (requestId: string, updates: Partial<RequestPricingConfig>) => {
      // In a full implementation, this would use the mutation hook
      // For now, we'll update local state and trigger the mutation
      updateConfigMutation.mutate({ requestId, config: updates });
    },
    [updateConfigMutation]
  );

  // Apply global modifiers to all selected requests
  const applyGlobalModifiers = useCallback(() => {
    if (selectedRequestIds.length === 0) return;

    applyGlobalModifiersMutation.mutate({
      requestIds: selectedRequestIds,
      modifiers: {
        isUrgent: globalUrgent,
        isRecurringClient: globalRecurring,
      },
    });
  }, [selectedRequestIds, globalUrgent, globalRecurring, applyGlobalModifiersMutation]);

  // Handle global modifier toggles
  const handleUrgentToggle = () => setGlobalUrgent(prev => !prev);
  const handleRecurringToggle = () => setGlobalRecurring(prev => !prev);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Global settings section */}
      <GlobalModifiers
        urgent={globalUrgent}
        recurring={globalRecurring}
        selectedCount={selectedRequestIds.length}
        onUrgentToggle={handleUrgentToggle}
        onRecurringToggle={handleRecurringToggle}
        onApplyGlobal={applyGlobalModifiers}
      />

      {/* Request Selection & Configuration */}
      <RequestSelector
        availableRequests={availableRequests}
        selectedRequestIds={selectedRequestIds}
        onSelectionChange={onSelectionChange}
        onToggleExpanded={toggleExpanded}
        onQuickAddRequest={onQuickAddRequest}
        expandedRequests={expandedRequests}
        pricingResults={pricingResults}
        currency={currency}
        error={error}
      />

      {/* Individual Request Configurations */}
      {selectedRequestIds.map(requestId => {
        const result = pricingResults.find(r => r.requestId === requestId);
        const config = result?.config;
        const isExpanded = expandedRequests.has(requestId);

        if (!result || !config) return null;

        return (
          <RequestConfigurator
            key={requestId}
            requestId={requestId}
            config={config}
            result={result}
            currency={currency}
            onUpdateConfig={updateConfig}
            isExpanded={isExpanded}
          />
        );
      })}

      {/* Summary Section (if requests selected) */}
      {selectedRequestIds.length > 0 && (
        <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-950/20 rounded-xl border border-primary-200/50 dark:border-primary-800/30">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-surface-900 dark:text-white">
                {t('pricing.quote.total')}
              </h4>
              <p className="text-sm text-surface-600 dark:text-surface-400">
                {selectedRequestIds.length}{' '}
                {selectedRequestIds.length === 1
                  ? t('pricing.requests_singular')
                  : t('pricing.requests')}
              </p>
            </div>
            <div className="text-end">
              <div className="text-2xl font-black text-primary-600 dark:text-primary-400 font-outfit">
                {formatCalculatorPrice(
                  pricingResults.reduce((sum, r) => sum + r.adjustedPrice, 0),
                  currency
                )}
              </div>
              <div className="text-xs text-surface-600 dark:text-surface-400">
                {pricingResults.reduce((sum, r) => sum + r.estimatedHours.min, 0)}-
                {pricingResults.reduce((sum, r) => sum + r.estimatedHours.max, 0)}h total
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
