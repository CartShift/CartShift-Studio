'use client';

import { useState, useMemo, useCallback } from 'react';
import { Currency, RequestType, REQUEST_TYPE } from '@/lib/types/portal';
import {
  EffortLevel,
  EFFORT_LEVEL,
  PricingModifiers,
  CalculatorResult,
} from '@/lib/types/pricing-calculator';
import {
  calculatePricing,
  calculateQuotePricing,
  formatCalculatorPrice,
  generateLineItemDescription,
} from '@/lib/services/pricing-calculator';

// Represents a single item added to the quote
export interface QuoteItem {
  id: string;
  requestType: RequestType;
  effortLevel: EffortLevel;
  description: string;
  basePrice: number; // Stored in target currency at time of adding
}

interface UsePricingCalculatorOptions {
  defaultCurrency?: Currency;
  defaultRequestType?: RequestType;
  defaultEffortLevel?: EffortLevel;
}

interface UsePricingCalculatorResult {
  // Current values (for the active calculator)
  requestType: RequestType;
  effortLevel: EffortLevel;
  currency: Currency;
  modifiers: PricingModifiers;

  // Setters
  setRequestType: (type: RequestType) => void;
  setEffortLevel: (level: EffortLevel) => void;
  setCurrency: (currency: Currency) => void;
  setModifiers: (modifiers: PricingModifiers) => void;
  toggleModifier: (modifier: 'urgent' | 'recurring') => void;
  setBundleCount: (count: number) => void;

  // Computed result for current selection
  result: CalculatorResult;
  formattedPrice: string;
  formattedBasePrice: string;

  // Quote items (multiple requests)
  quoteItems: QuoteItem[];
  addToQuote: (locale?: string) => void;
  removeFromQuote: (itemId: string) => void;
  clearQuote: () => void;
  quoteTotalPrice: number;
  formattedQuoteTotalPrice: string;
  quoteHasItems: boolean;
  quoteResult: ReturnType<typeof calculateQuotePricing>;

  // Actions
  reset: () => void;
  getLineItem: (locale?: string) => {
    description: string;
    quantity: number;
    unitPrice: number;
  };
  getAllLineItems: (locale?: string) => Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

/**
 * Hook for managing pricing calculator state and calculations.
 * Supports both single calculations and building a multi-item quote.
 *
 * @example
 * ```tsx
 * const {
 *   requestType,
 *   setRequestType,
 *   addToQuote,
 *   quoteItems,
 *   quoteTotalPrice,
 * } = usePricingCalculator({ defaultCurrency: 'ILS' });
 * ```
 */
export function usePricingCalculator(
  options: UsePricingCalculatorOptions = {}
): UsePricingCalculatorResult {
  const {
    defaultCurrency = 'ILS',
    defaultRequestType = REQUEST_TYPE.FEATURE,
    defaultEffortLevel = EFFORT_LEVEL.MEDIUM,
  } = options;

  // State for current selection
  const [requestType, setRequestType] = useState<RequestType>(defaultRequestType);
  const [effortLevel, setEffortLevel] = useState<EffortLevel>(defaultEffortLevel);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [modifiers, setModifiers] = useState<PricingModifiers>({});

  // State for quote items
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

  // Toggle individual modifiers
  const toggleModifier = useCallback((modifier: 'urgent' | 'recurring') => {
    setModifiers(prev => {
      if (modifier === 'urgent') {
        return { ...prev, isUrgent: !prev.isUrgent };
      }
      if (modifier === 'recurring') {
        return { ...prev, isRecurringClient: !prev.isRecurringClient };
      }
      return prev;
    });
  }, []);

  // Set bundle count
  const setBundleCount = useCallback((count: number) => {
    setModifiers(prev => ({ ...prev, bundleCount: count }));
  }, []);

  // Calculate result for current selection (using global modifiers)
  const result = useMemo(() => {
    return calculatePricing({
      requestType,
      effortLevel,
      currency,
      modifiers,
    });
  }, [requestType, effortLevel, currency, modifiers]);

  // Format prices
  const formattedPrice = useMemo(
    () => formatCalculatorPrice(result.adjustedPrice, currency),
    [result.adjustedPrice, currency]
  );

  const formattedBasePrice = useMemo(
    () => formatCalculatorPrice(result.basePrice, currency),
    [result.basePrice, currency]
  );

  // Quote calculation (global)
  const quoteResult = useMemo(() => {
    return calculateQuotePricing(quoteItems, currency, modifiers);
  }, [quoteItems, currency, modifiers]);

  const quoteTotalPrice = quoteResult.totalAdjustedPrice;

  const formattedQuoteTotalPrice = useMemo(
    () => formatCalculatorPrice(quoteTotalPrice, currency),
    [quoteTotalPrice, currency]
  );

  const quoteHasItems = quoteItems.length > 0;

  // Add current selection to quote
  const addToQuote = useCallback(
    (locale: string = 'en') => {
      const newItem: QuoteItem = {
        id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestType,
        effortLevel,
        description: generateLineItemDescription(requestType, effortLevel, locale),
        basePrice: result.basePrice, // This is in current selection's currency
      };
      setQuoteItems(prev => [...prev, newItem]);

      // Reset item selection but keep modifiers/currency
      setRequestType(defaultRequestType);
      setEffortLevel(defaultEffortLevel);
    },
    [requestType, effortLevel, result.basePrice, defaultRequestType, defaultEffortLevel]
  );

  // Remove item from quote
  const removeFromQuote = useCallback((itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Clear all quote items
  const clearQuote = useCallback(() => {
    setQuoteItems([]);
  }, []);

  // Reset current selection and global settings
  const reset = useCallback(() => {
    setRequestType(defaultRequestType);
    setEffortLevel(defaultEffortLevel);
    setCurrency(defaultCurrency);
    setModifiers({});
    setQuoteItems([]);
  }, [defaultCurrency, defaultEffortLevel, defaultRequestType]);

  // Generate a single line item for current selection
  const getLineItem = useCallback(
    (locale: string = 'en') => ({
      description: generateLineItemDescription(requestType, effortLevel, locale),
      quantity: 1,
      unitPrice: result.adjustedPrice,
    }),
    [requestType, effortLevel, result.adjustedPrice]
  );

  // Get all line items from the quote, applying global modifiers to each
  const getAllLineItems = useCallback(
    (locale: string = 'en') => {
      if (quoteItems.length === 0) {
        return [getLineItem(locale)];
      }

      // Calculate the ratio factors for price distribution
      // Ratio = TotalAdjusted / TotalBase
      const ratio = quoteResult.totalAdjustedPrice / quoteResult.totalBasePrice;

      return quoteItems.map(item => ({
        description: item.description,
        quantity: 1,
        // Proportional price distribution keeps it consistent with global adjustments
        unitPrice: Math.round(item.basePrice * ratio),
      }));
    },
    [quoteItems, quoteResult.totalAdjustedPrice, quoteResult.totalBasePrice, getLineItem]
  );

  return {
    requestType,
    effortLevel,
    currency,
    modifiers,
    setRequestType,
    setEffortLevel,
    setCurrency,
    setModifiers,
    toggleModifier,
    setBundleCount,
    result,
    formattedPrice,
    formattedBasePrice,
    quoteItems,
    addToQuote,
    removeFromQuote,
    clearQuote,
    quoteTotalPrice,
    formattedQuoteTotalPrice,
    quoteHasItems,
    quoteResult,
    reset,
    getLineItem,
    getAllLineItems,
  };
}
