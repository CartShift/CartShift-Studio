'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  PricingLineItem,
  Currency,
  generateLineItemId,
  calculateTotalAmount,
} from '@/lib/types/portal';

interface UsePricingFormResult {
  // State
  lineItems: PricingLineItem[];
  currency: Currency;
  isFormVisible: boolean;

  // Setters
  setCurrency: (currency: Currency) => void;
  setFormVisible: (visible: boolean) => void;

  // Line item actions
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof PricingLineItem, value: string | number) => void;
  resetForm: () => void;

  // Computed values
  totalAmount: number;
  validItems: PricingLineItem[];
  isValid: boolean;
}

const createEmptyLineItem = (): PricingLineItem => ({
  id: generateLineItemId(),
  description: '',
  quantity: 1,
  unitPrice: 0,
});

/**
 * Hook for managing pricing form state.
 * Handles line items, currency, validation, and computed totals.
 *
 * @example
 * ```tsx
 * const {
 *   lineItems,
 *   currency,
 *   addLineItem,
 *   updateLineItem,
 *   totalAmount,
 *   isValid,
 * } = usePricingForm();
 * ```
 */
export function usePricingForm(defaultCurrency: Currency = 'USD'): UsePricingFormResult {
  const [lineItems, setLineItems] = useState<PricingLineItem[]>([createEmptyLineItem()]);
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [isFormVisible, setFormVisible] = useState(false);

  const addLineItem = useCallback(() => {
    setLineItems(prev => [...prev, createEmptyLineItem()]);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems(prev => {
      if (prev.length <= 1) return prev;
      return prev.filter(item => item.id !== id);
    });
  }, []);

  const updateLineItem = useCallback(
    (id: string, field: keyof PricingLineItem, value: string | number) => {
      setLineItems(prev => prev.map(item => (item.id === id ? { ...item, [field]: value } : item)));
    },
    []
  );

  const resetForm = useCallback(() => {
    setLineItems([createEmptyLineItem()]);
    setFormVisible(false);
  }, []);

  // Computed values
  const validItems = useMemo(
    () =>
      lineItems.filter(item => item.description.trim() && item.quantity > 0 && item.unitPrice >= 0),
    [lineItems]
  );

  const totalAmount = useMemo(() => calculateTotalAmount(lineItems), [lineItems]);

  const isValid = validItems.length > 0;

  return {
    lineItems,
    currency,
    isFormVisible,
    setCurrency,
    setFormVisible,
    addLineItem,
    removeLineItem,
    updateLineItem,
    resetForm,
    totalAmount,
    validItems,
    isValid,
  };
}
