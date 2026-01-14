import { RequestType } from '@/lib/types/portal';
import { EffortLevel } from '@/lib/types/pricing-calculator';

// ============================================
// PRICING COLORS FOR REQUEST TYPES
// ============================================

export const PRICING_COLORS: Record<RequestType, { bg: string; text: string; border: string }> = {
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
} as const;

// ============================================
// PRICING MODIFIERS CONSTANTS
// ============================================

export const PRICING_MODIFIERS = {
  URGENT_MULTIPLIER: 1.5,
  RECURRING_DISCOUNT: 0.95,
  BUNDLE_DISCOUNT: 0.9,
  BUNDLE_MIN_ITEMS: 3,
} as const;

// ============================================
// UI CONSTANTS
// ============================================

export const PRICING_UI = {
  EXPANSION_ANIMATION_DURATION: 0.2,
  DEBOUNCE_DELAY: 300,
  MAX_CUSTOM_PRICE: 1000000, // $10,000 in cents
  MIN_CUSTOM_PRICE: 0,
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const PRICING_ERRORS = {
  INVALID_PRICE: 'Please enter a valid price',
  PRICE_TOO_HIGH: 'Price exceeds maximum allowed amount',
  PRICE_TOO_LOW: 'Price must be at least $0',
  CALCULATION_FAILED: 'Failed to calculate pricing',
  CONFIG_UPDATE_FAILED: 'Failed to update pricing configuration',
} as const;

// ============================================
// TYPE MAPPINGS
// ============================================

export const TYPE_LABELS: Record<RequestType, { en: string; he: string }> = {
  feature: { en: 'New Feature Development', he: "פיתוח פיצ'ר חדש" },
  bug: { en: 'Bug Fix', he: 'תיקון באג' },
  optimization: { en: 'Performance Optimization', he: 'אופטימיזציה' },
  content: { en: 'Content Update', he: 'עדכון תוכן' },
  design: { en: 'Design Work', he: 'עבודת עיצוב' },
  other: { en: 'Development Work', he: 'עבודת פיתוח' },
} as const;

export const EFFORT_LABELS: Record<EffortLevel, { en: string; he: string }> = {
  low: { en: 'Minor', he: 'קטן' },
  medium: { en: 'Standard', he: 'רגיל' },
  high: { en: 'Major', he: 'גדול' },
  complex: { en: 'Complex', he: 'מורכב' },
} as const;
