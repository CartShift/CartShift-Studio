// ============================================
// PRICING CONSTANTS
// ============================================

export const TAX_RATE = 0.18; // Israeli standard VAT rate since January 1, 2025
export const TRANSITION_DELAY = 500; // ms for page transitions
export const REDIRECT_DELAY = 1500; // ms before redirect after save
export const ITEMS_PER_PAGE = 10; // Items per page in pricing table
export const PRIORITY_RECOMMENDATIONS_COUNT = 3; // Max number of priority recommendations

export const PRICING_UI = {
  MIN_CUSTOM_PRICE: 50,
  MAX_CUSTOM_PRICE: 10000,
  EXPANSION_ANIMATION_DURATION: 0.3,
} as const;

export const PRICING_ERRORS = {
  PRICE_TOO_HIGH: 'priceTooHigh',
  PRICE_TOO_LOW: 'priceTooLow',
} as const;

export const PRICING_COLORS = {
  feature: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  bug: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  optimization: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  content: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
} as const;
