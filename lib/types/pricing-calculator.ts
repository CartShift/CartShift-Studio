import { RequestType, Currency } from './portal';

// ============================================
// EFFORT LEVELS
// ============================================

export const EFFORT_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  COMPLEX: 'complex',
} as const;

export type EffortLevel = (typeof EFFORT_LEVEL)[keyof typeof EFFORT_LEVEL];

// Effort level configuration for UI
export const EFFORT_LEVEL_CONFIG: Record<
  EffortLevel,
  {
    label: string;
    labelHe: string;
    color: string;
    bgColor: string;
    description: string;
    descriptionHe: string;
    hoursRange: string;
    hoursRangeHe: string;
  }
> = {
  low: {
    label: 'Low',
    labelHe: 'נמוך',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    description: 'Simple tasks, quick fixes',
    descriptionHe: 'משימות פשוטות, תיקונים מהירים',
    hoursRange: '1-4 hours',
    hoursRangeHe: '1-4 שעות',
  },
  medium: {
    label: 'Medium',
    labelHe: 'בינוני',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    description: 'Standard development work',
    descriptionHe: 'עבודת פיתוח סטנדרטית',
    hoursRange: '4-12 hours',
    hoursRangeHe: '4-12 שעות',
  },
  high: {
    label: 'High',
    labelHe: 'גבוה',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    description: 'Complex features, significant changes',
    descriptionHe: "פיצ'רים מורכבים, שינויים משמעותיים",
    hoursRange: '12-24 hours',
    hoursRangeHe: '12-24 שעות',
  },
  complex: {
    label: 'Complex',
    labelHe: 'מורכב',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    description: 'Major features, architectural changes',
    descriptionHe: "פיצ'רים גדולים, שינויים ארכיטקטוניים",
    hoursRange: '24+ hours',
    hoursRangeHe: '24+ שעות',
  },
};

// ============================================
// PRICING MATRIX
// ============================================

// Base prices in cents (ILS) - adjust as needed
export const PRICING_MATRIX: Record<RequestType, Record<EffortLevel, number>> = {
  feature: {
    low: 55000, // ₪550
    medium: 150000, // ₪1,500
    high: 300000, // ₪3,000
    complex: 560000, // ₪5,600
  },
  bug: {
    low: 28000, // ₪280
    medium: 75000, // ₪750
    high: 170000, // ₪1,700
    complex: 300000, // ₪3,000
  },
  optimization: {
    low: 37000, // ₪370
    medium: 112000, // ₪1,120
    high: 225000, // ₪2,250
    complex: 450000, // ₪4,500
  },
  content: {
    low: 19000, // ₪190
    medium: 56000, // ₪560
    high: 130000, // ₪1,300
    complex: 260000, // ₪2,600
  },
  design: {
    low: 47000, // ₪470
    medium: 130000, // ₪1,300
    high: 260000, // ₪2,600
    complex: 520000, // ₪5,200
  },
  other: {
    low: 37000, // ₪370
    medium: 93000, // ₪930
    high: 187000, // ₪1,870
    complex: 375000, // ₪3,750
  },
};

// ============================================
// MODIFIERS
// ============================================

export const MODIFIER_CONFIG = {
  urgent: {
    id: 'urgent',
    label: 'Urgent Work',
    labelHe: 'עבודה דחופה',
    description: '+50% surcharge',
    descriptionHe: '+50% תוספת',
    multiplier: 1.5,
    type: 'multiply' as const,
  },
  bundle: {
    id: 'bundle',
    label: 'Bundle Discount',
    labelHe: 'הנחת חבילה',
    description: '-10% for 3+ items',
    descriptionHe: '-10% עבור 3+ פריטים',
    multiplier: 0.9,
    type: 'multiply' as const,
    minItems: 3,
  },
  recurring: {
    id: 'recurring',
    label: 'Recurring Client',
    labelHe: 'לקוח חוזר',
    description: '-5% loyalty discount',
    descriptionHe: '-5% הנחת נאמנות',
    multiplier: 0.95,
    type: 'multiply' as const,
  },
} as const;

export type ModifierId = keyof typeof MODIFIER_CONFIG;

export interface PricingModifiers {
  isUrgent?: boolean;
  bundleCount?: number;
  isRecurringClient?: boolean;
  customMultiplier?: number;
  customAdjustment?: number; // Fixed amount to add/subtract
}

// ============================================
// CALCULATOR RESULT
// ============================================

export interface PriceBreakdownItem {
  id: string;
  label: string;
  labelHe: string;
  amount: number;
  type: 'base' | 'add' | 'subtract' | 'multiply';
  percentage?: number;
}

export interface CalculatorResult {
  requestType: RequestType;
  effortLevel: EffortLevel;
  currency: Currency;
  basePrice: number;
  modifiers: PricingModifiers;
  adjustedPrice: number;
  breakdown: PriceBreakdownItem[];
  estimatedHours: {
    min: number;
    max: number;
  };
}

// ============================================
// CALCULATOR INPUT
// ============================================

export interface CalculatorInput {
  requestType: RequestType;
  effortLevel: EffortLevel;
  currency: Currency;
  modifiers: PricingModifiers;
}

// ============================================
// HOUR ESTIMATES
// ============================================

export const EFFORT_HOURS: Record<EffortLevel, { min: number; max: number }> = {
  low: { min: 1, max: 4 },
  medium: { min: 4, max: 12 },
  high: { min: 12, max: 24 },
  complex: { min: 24, max: 60 },
};
