import { RequestType, Currency, CURRENCY_CONFIG } from '@/lib/types/portal';
import {
  EffortLevel,
  PricingModifiers,
  CalculatorResult,
  CalculatorInput,
  PriceBreakdownItem,
  PRICING_MATRIX,
  MODIFIER_CONFIG,
  EFFORT_HOURS,
} from '@/lib/types/pricing-calculator';

// ============================================
// CURRENCY CONVERSION
// ============================================

// Approximate exchange rates (ILS base)
const EXCHANGE_RATES: Record<Currency, number> = {
  ILS: 1,
  USD: 0.27,  // 1 ILS ≈ $0.27
  EUR: 0.25,  // 1 ILS ≈ €0.25
};

/**
 * Convert amount from ILS to target currency
 */
export function convertCurrency(amountInILS: number, targetCurrency: Currency): number {
  const rate = EXCHANGE_RATES[targetCurrency];
  return Math.round(amountInILS * rate);
}

/**
 * Convert amount from source currency to ILS
 */
export function convertToILS(amount: number, sourceCurrency: Currency): number {
  const rate = EXCHANGE_RATES[sourceCurrency];
  return Math.round(amount / rate);
}

// ============================================
// BASE PRICE CALCULATION
// ============================================

/**
 * Get the base price for a request type and effort level
 * Returns price in cents (ILS)
 */
export function getBasePrice(requestType: RequestType, effortLevel: EffortLevel): number {
  return PRICING_MATRIX[requestType]?.[effortLevel] ?? PRICING_MATRIX.other.medium;
}

/**
 * Get base price in the specified currency
 */
export function getBasePriceInCurrency(
  requestType: RequestType,
  effortLevel: EffortLevel,
  currency: Currency
): number {
  const basePriceILS = getBasePrice(requestType, effortLevel);
  return convertCurrency(basePriceILS, currency);
}

// ============================================
// MODIFIER APPLICATION
// ============================================

/**
 * Apply modifiers to a base price and return detailed breakdown
 */
export function applyModifiers(
  basePrice: number,
  modifiers: PricingModifiers
): { adjustedPrice: number; breakdown: PriceBreakdownItem[] } {
  const breakdown: PriceBreakdownItem[] = [];
  let currentPrice = basePrice;

  // Base price entry
  breakdown.push({
    id: 'base',
    label: 'Base Price',
    labelHe: 'מחיר בסיס',
    amount: basePrice,
    type: 'base',
  });

  // Apply urgent modifier (+50%)
  if (modifiers.isUrgent) {
    const surcharge = Math.round(currentPrice * 0.5);
    currentPrice += surcharge;
    breakdown.push({
      id: 'urgent',
      label: MODIFIER_CONFIG.urgent.label,
      labelHe: MODIFIER_CONFIG.urgent.labelHe,
      amount: surcharge,
      type: 'add',
      percentage: 50,
    });
  }

  // Apply bundle discount (-10% for 3+ items)
  if (modifiers.bundleCount && modifiers.bundleCount >= MODIFIER_CONFIG.bundle.minItems) {
    const discount = Math.round(currentPrice * 0.1);
    currentPrice -= discount;
    breakdown.push({
      id: 'bundle',
      label: MODIFIER_CONFIG.bundle.label,
      labelHe: MODIFIER_CONFIG.bundle.labelHe,
      amount: -discount,
      type: 'subtract',
      percentage: 10,
    });
  }

  // Apply recurring client discount (-5%)
  if (modifiers.isRecurringClient) {
    const discount = Math.round(currentPrice * 0.05);
    currentPrice -= discount;
    breakdown.push({
      id: 'recurring',
      label: MODIFIER_CONFIG.recurring.label,
      labelHe: MODIFIER_CONFIG.recurring.labelHe,
      amount: -discount,
      type: 'subtract',
      percentage: 5,
    });
  }

  // Apply custom multiplier
  if (modifiers.customMultiplier && modifiers.customMultiplier !== 1) {
    const difference = Math.round(currentPrice * (modifiers.customMultiplier - 1));
    currentPrice = Math.round(currentPrice * modifiers.customMultiplier);
    breakdown.push({
      id: 'custom-multiplier',
      label: 'Custom Adjustment',
      labelHe: 'התאמה מותאמת',
      amount: difference,
      type: difference >= 0 ? 'add' : 'subtract',
      percentage: Math.round((modifiers.customMultiplier - 1) * 100),
    });
  }

  // Apply custom fixed adjustment
  if (modifiers.customAdjustment && modifiers.customAdjustment !== 0) {
    currentPrice += modifiers.customAdjustment;
    breakdown.push({
      id: 'custom-adjustment',
      label: 'Fixed Adjustment',
      labelHe: 'התאמה קבועה',
      amount: modifiers.customAdjustment,
      type: modifiers.customAdjustment >= 0 ? 'add' : 'subtract',
    });
  }

  return {
    adjustedPrice: Math.max(0, currentPrice), // Never go below 0
    breakdown,
  };
}

// ============================================
// MAIN CALCULATION
// ============================================

/**
 * Calculate full pricing estimate with breakdown
 */
export function calculatePricing(input: CalculatorInput): CalculatorResult {
  const { requestType, effortLevel, currency, modifiers } = input;

  // Get base price in target currency
  const basePrice = getBasePriceInCurrency(requestType, effortLevel, currency);

  // Apply modifiers
  const { adjustedPrice, breakdown } = applyModifiers(basePrice, modifiers);

  // Get hour estimates
  const estimatedHours = EFFORT_HOURS[effortLevel];

  return {
    requestType,
    effortLevel,
    currency,
    basePrice,
    modifiers,
    adjustedPrice,
    breakdown,
    estimatedHours,
  };
}

/**
 * Calculate pricing for a collection of items with global modifiers
 */
export function calculateQuotePricing(
  items: Array<{ requestType: RequestType; effortLevel: EffortLevel }>,
  currency: Currency,
  modifiers: PricingModifiers
): {
  totalBasePrice: number;
  totalAdjustedPrice: number;
  breakdown: PriceBreakdownItem[];
  totalEstimatedHours: { min: number; max: number };
} {
  // 1. Calculate sum of base prices in target currency
  let totalBasePrice = 0;
  let minHours = 0;
  let maxHours = 0;

  items.forEach(item => {
    totalBasePrice += getBasePriceInCurrency(item.requestType, item.effortLevel, currency);
    const hours = EFFORT_HOURS[item.effortLevel];
    minHours += hours.min;
    maxHours += hours.max;
  });

  // 2. Apply global modifiers to the total base price
  // Note: We pass bundleCount as total items if not explicitly provided
  const effectiveModifiers = {
    ...modifiers,
    bundleCount: modifiers.bundleCount ?? items.length,
  };

  const { adjustedPrice, breakdown } = applyModifiers(totalBasePrice, effectiveModifiers);

  return {
    totalBasePrice,
    totalAdjustedPrice: adjustedPrice,
    breakdown,
    totalEstimatedHours: { min: minHours, max: maxHours },
  };
}

// ============================================
// FORMATTING UTILITIES
// ============================================

/**
 * Format price for display
 */
export function formatCalculatorPrice(amountInCents: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  const amount = amountInCents / 100;
  return `${config.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Format price range for display
 */
export function formatPriceRange(
  minCents: number,
  maxCents: number,
  currency: Currency
): string {
  const config = CURRENCY_CONFIG[currency];
  const minAmount = minCents / 100;
  const maxAmount = maxCents / 100;
  return `${config.symbol}${minAmount.toLocaleString()} - ${config.symbol}${maxAmount.toLocaleString()}`;
}

/**
 * Get all prices for a request type across all effort levels
 */
export function getPricesForType(
  requestType: RequestType,
  currency: Currency
): Record<EffortLevel, number> {
  return {
    low: getBasePriceInCurrency(requestType, 'low', currency),
    medium: getBasePriceInCurrency(requestType, 'medium', currency),
    high: getBasePriceInCurrency(requestType, 'high', currency),
    complex: getBasePriceInCurrency(requestType, 'complex', currency),
  };
}

/**
 * Generate a suggested line item description based on type and effort
 */
export function generateLineItemDescription(
  requestType: RequestType,
  effortLevel: EffortLevel,
  locale: string = 'en'
): string {
  const typeLabels: Record<RequestType, { en: string; he: string }> = {
    feature: { en: 'New Feature Development', he: 'פיתוח פיצ\'ר חדש' },
    bug: { en: 'Bug Fix', he: 'תיקון באג' },
    optimization: { en: 'Performance Optimization', he: 'אופטימיזציה' },
    content: { en: 'Content Update', he: 'עדכון תוכן' },
    design: { en: 'Design Work', he: 'עבודת עיצוב' },
    other: { en: 'Development Work', he: 'עבודת פיתוח' },
  };

  const effortLabels: Record<EffortLevel, { en: string; he: string }> = {
    low: { en: 'Minor', he: 'קטן' },
    medium: { en: 'Standard', he: 'רגיל' },
    high: { en: 'Major', he: 'גדול' },
    complex: { en: 'Complex', he: 'מורכב' },
  };

  const isHebrew = locale === 'he';
  const typeLabel = typeLabels[requestType]?.[isHebrew ? 'he' : 'en'] ?? typeLabels.other[isHebrew ? 'he' : 'en'];
  const effortLabel = effortLabels[effortLevel]?.[isHebrew ? 'he' : 'en'] ?? effortLabels.medium[isHebrew ? 'he' : 'en'];

  return isHebrew ? `${typeLabel} - ${effortLabel}` : `${effortLabel} ${typeLabel}`;
}
