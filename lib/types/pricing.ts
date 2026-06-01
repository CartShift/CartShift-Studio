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
export type PricingType = 'fixed' | 'hourly' | 'estimate';
export type ProposalType = 'pricing_offer' | 'work_proposal';
export type ProposalPaymentStatus =
  | 'not_required'
  | 'pending'
  | 'partially_paid'
  | 'paid'
  | 'failed';
export type ProposalPaymentType = 'deposit' | 'installment' | 'final';
export type ProposalPaymentRecordStatus = 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
export type ProposalPaymentProvider = 'paypal' | 'manual';
export type ManualPaymentMethod =
  | 'bank_transfer'
  | 'cash'
  | 'bit'
  | 'paybox'
  | 'check'
  | 'credit_card_manual'
  | 'other';

// ============================================
// CORE TYPES
// ============================================

export interface PricingLineItem {
  id: string;
  title?: string;
  description: string;
  quantity: number;
  unitPrice: number; // in cents/smallest currency unit
  notes?: string;
  pricingType?: PricingType;
  sortOrder?: number;
  requestId?: string;
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
  proposalType?: ProposalType;
  terms?: string;
  publicToken?: string;
  publicAccessEnabled?: boolean;

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
  timeframe?: string;
  workDeadline?: Timestamp;
  assignedTo?: string;
  assignedToName?: string;

  // Payment info
  paymentId?: string; // PayPal transaction ID
  paidAt?: Timestamp;
  firstPaymentAt?: Timestamp;
  lastPaymentAt?: Timestamp;
  paymentMethod?: 'paypal' | 'manual';
  paymentRequired?: boolean;
  depositAmount?: number;
  amountPaid?: number;
  balanceDue?: number;
  pendingAmount?: number;
  billingMode?: 'manual_installments';
  paymentStatus?: ProposalPaymentStatus;
  paymentProvider?: 'paypal';
  paymentReference?: string;
  materializedRequestIds?: string[];
  requestsMaterializedAt?: Timestamp;

  // Signature audit trail
  acceptedByName?: string;
  acceptedByEmail?: string;
  signatureText?: string;
  termsAcceptedAt?: Timestamp;
  acceptedIp?: string;
  acceptedUserAgent?: string;
  lockedAt?: Timestamp;

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
  timeframe?: string;
  workDeadline?: Date;
  assignedTo?: string;
  assignedToName?: string;
  clientName?: string;
  clientEmail?: string;
  agencyNotes?: string;
  requestIds?: string[]; // Optional: link to existing requests
  proposalType?: ProposalType;
  terms?: string;
  publicAccessEnabled?: boolean;
  paymentRequired?: boolean;
  depositAmount?: number;
  billingMode?: 'manual_installments';
}

export interface UpdatePricingRequestData {
  title?: string;
  description?: string;
  lineItems?: PricingLineItem[];
  currency?: Currency;
  taxRate?: number;
  validUntil?: Date;
  timeframe?: string;
  workDeadline?: Date;
  assignedTo?: string;
  assignedToName?: string;
  clientName?: string;
  clientEmail?: string;
  clientNotes?: string;
  agencyNotes?: string;
  status?: PricingStatus;
  requestIds?: string[];
  proposalType?: ProposalType;
  terms?: string;
  publicAccessEnabled?: boolean;
  paymentRequired?: boolean;
  depositAmount?: number;
  billingMode?: 'manual_installments';
}

export interface AcceptPricingRequestPayload {
  termsAccepted: boolean;
  acceptedByName: string;
  acceptedByEmail?: string;
  signatureText: string;
}

export interface ProposalPaymentRecord {
  id: string;
  proposalId: string;
  paymentToken: string;
  type: ProposalPaymentType;
  label: string;
  amount: number;
  currency: Currency;
  dueAt?: Timestamp;
  status: ProposalPaymentRecordStatus;
  provider: ProposalPaymentProvider;
  manualMethod?: ManualPaymentMethod;
  manualReference?: string;
  note?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paidAt?: Timestamp;
  failedAt?: Timestamp;
  canceledAt?: Timestamp;
  refundedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PublicProposalPayment {
  id: string;
  paymentToken: string;
  type: ProposalPaymentType;
  label: string;
  amount: number;
  currency: Currency;
  dueAt?: string;
  status: ProposalPaymentRecordStatus;
  provider: ProposalPaymentProvider;
  manualMethod?: ManualPaymentMethod;
}

export interface AgencyProposalPayment extends PublicProposalPayment {
  manualReference?: string;
  note?: string;
}

export interface PublicPricingProposal {
  id: string;
  title: string;
  description?: string;
  lineItems: PricingLineItem[];
  totalAmount: number;
  taxRate: number;
  currency: Currency;
  status: PricingStatus;
  proposalType: ProposalType;
  terms?: string;
  clientName?: string;
  validUntil?: string;
  timeframe?: string;
  workDeadline?: string;
  acceptedAt?: string;
  lockedAt?: string;
  paymentRequired: boolean;
  depositAmount?: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: ProposalPaymentStatus;
  payments: PublicProposalPayment[];
  canAccept: boolean;
  isPreview: boolean;
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

export function allocateLineItemTotals(
  lineItems: PricingLineItem[],
  totalAmount: number
): Array<{ item: PricingLineItem; itemSubtotal: number; totalAmount: number }> {
  const subtotal = calculateSubtotal(lineItems);
  let allocated = 0;

  return lineItems.map((item, index) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const allocatedTotal =
      index === lineItems.length - 1
        ? totalAmount - allocated
        : subtotal > 0
          ? Math.round((totalAmount * itemSubtotal) / subtotal)
          : 0;
    allocated += allocatedTotal;
    return { item, itemSubtotal, totalAmount: allocatedTotal };
  });
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
