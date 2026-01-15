import { Timestamp } from 'firebase/firestore';

// ============================================
// ENUMS & CONSTANTS
// ============================================

export const PRICING_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CLIENT_EDITED: 'CLIENT_EDITED',
  ACCEPTED: 'ACCEPTED',
  PAID: 'PAID',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CANCELED: 'CANCELED',
} as const;

export const CURRENCY = {
  USD: 'USD',
  ILS: 'ILS',
  EUR: 'EUR',
} as const;

export type PricingStatus = (typeof PRICING_STATUS)[keyof typeof PRICING_STATUS];
export type Currency = (typeof CURRENCY)[keyof typeof CURRENCY];

// ============================================
// CORE TYPES
// ============================================

export interface PricingLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents/smallest currency unit
  notes?: string;
}

export interface PricingRequest {
  id: string;
  orgId: string;
  title: string;
  description?: string;
  lineItems: PricingLineItem[];
  totalAmount: number; // calculated sum in cents/smallest currency unit
  taxRate?: number; // Tax rate as decimal (e.g. 0.17 for 17%)
  currency: Currency;
  status: PricingStatus;

  // Linked requests - allows bundling multiple requests into one pricing offer
  requestIds?: string[]; // Array of linked Request IDs

  // Client info
  clientName?: string;
  clientEmail?: string;
  clientNotes?: string; // Notes from client

  // Agency info
  createdBy: string; // Agency user ID
  createdByName: string;
  agencyNotes?: string; // Internal notes

  // Validity
  validUntil?: Timestamp;

  // Payment info
  paymentId?: string; // PayPal transaction ID
  paidAt?: Timestamp;
  paymentMethod?: 'paypal';

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  sentAt?: Timestamp;
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface CreatePricingRequestData {
  title: string;
  description?: string;
  lineItems: Omit<PricingLineItem, 'id'>[];
  currency: Currency;
  taxRate?: number;
  validUntil?: Date;
  clientName?: string;
  clientEmail?: string;
  agencyNotes?: string;
  requestIds?: string[]; // Optional: link to existing requests
}

export interface UpdatePricingRequestData {
  title?: string;
  description?: string;
  lineItems?: PricingLineItem[];
  currency?: Currency;
  taxRate?: number;
  validUntil?: Date;
  clientName?: string;
  clientEmail?: string;
  clientNotes?: string;
  agencyNotes?: string;
  status?: PricingStatus;
  requestIds?: string[];
}

// ============================================
// UI HELPER TYPES
// ============================================

export interface PricingStatusConfig {
  label: string;
  color: 'gray' | 'blue' | 'yellow' | 'purple' | 'green' | 'emerald' | 'red' | 'orange';
  bgClass: string;
  textClass: string;
}

export const PRICING_STATUS_CONFIG: Record<PricingStatus, PricingStatusConfig> = {
  DRAFT: {
    label: 'Draft',
    color: 'gray',
    bgClass: 'bg-surface-100 dark:bg-surface-500/20',
    textClass: 'text-surface-700 dark:text-surface-300',
  },
  SENT: {
    label: 'Sent',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  CLIENT_EDITED: {
    label: 'Client Edited',
    color: 'orange',
    bgClass: 'bg-orange-100 dark:bg-orange-500/20',
    textClass: 'text-orange-700 dark:text-orange-300',
  },
  ACCEPTED: {
    label: 'Accepted',
    color: 'purple',
    bgClass: 'bg-purple-100 dark:bg-purple-500/20',
    textClass: 'text-purple-700 dark:text-purple-300',
  },
  PAID: {
    label: 'Paid',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-500/20',
    textClass: 'text-green-700 dark:text-green-300',
  },
  DECLINED: {
    label: 'Declined',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-500/20',
    textClass: 'text-red-700 dark:text-red-300',
  },
  EXPIRED: {
    label: 'Expired',
    color: 'gray',
    bgClass: 'bg-surface-100 dark:bg-surface-500/20',
    textClass: 'text-surface-700 dark:text-surface-300',
  },
  CANCELED: {
    label: 'Canceled',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-500/20',
    textClass: 'text-red-700 dark:text-red-300',
  },
};

export const CURRENCY_CONFIG: Record<Currency, { symbol: string; name: string }> = {
  USD: { symbol: '$', name: 'US Dollar' },
  ILS: { symbol: '₪', name: 'Israeli Shekel' },
  EUR: { symbol: '€', name: 'Euro' },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateTotalAmount(lineItems: PricingLineItem[], taxRate: number = 0): number {
  const subtotal = calculateSubtotal(lineItems);
  const tax = Math.round(subtotal * taxRate);
  return subtotal + tax;
}

export function calculateSubtotal(lineItems: PricingLineItem[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate);
}

export function formatCurrency(amountInCents: number, currency: Currency): string {
  const config = CURRENCY_CONFIG[currency];
  const amount = amountInCents / 100;
  return `${config.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateLineItemId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
