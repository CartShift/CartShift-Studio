import { Timestamp } from 'firebase/firestore';
import { Currency } from '@/lib/types/pricing';

export const PROFIT_SPLIT_ROLE = {
  LEAD: 'lead',
  SALES: 'sales',
  MANAGEMENT: 'management',
  DELIVERY: 'delivery',
} as const;

export const PROFIT_SPLIT_STATUS = {
  DRAFT: 'draft',
  FINALIZED: 'finalized',
} as const;

export const DEFAULT_PROFIT_SPLIT_PERCENTAGES: Record<ProfitSplitRole, number> = {
  lead: 15,
  sales: 10,
  management: 25,
  delivery: 50,
};

export type ProfitSplitRole = (typeof PROFIT_SPLIT_ROLE)[keyof typeof PROFIT_SPLIT_ROLE];
export type ProfitSplitStatus = (typeof PROFIT_SPLIT_STATUS)[keyof typeof PROFIT_SPLIT_STATUS];

export interface ProfitSplitParticipant {
  id: string;
  userId: string;
  userName: string;
  role: ProfitSplitRole;
  percentage: number;
  amount: number;
  notes?: string;
}

export interface ProfitSplitExpense {
  id: string;
  description: string;
  amount: number;
}

export interface ProfitSplit {
  id: string;
  pricingRequestId: string;
  orgId: string;
  clientName?: string;
  clientEmail?: string;
  projectTitle: string;
  currency: Currency;
  grossRevenue: number;
  directExpenses: ProfitSplitExpense[];
  totalExpenses: number;
  netProfit: number;
  participants: ProfitSplitParticipant[];
  totalAllocatedPercentage: number;
  totalAllocatedAmount: number;
  unallocatedPercentage: number;
  unallocatedAmount: number;
  status: ProfitSplitStatus;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  finalizedAt?: Timestamp;
  inspectedPaymentIds?: string[];
  proposalPaymentStatus?: string;
  reconciliationRequired?: boolean;
}

export interface ProfitSplitCalculationInput {
  grossRevenue: number;
  directExpenses: ProfitSplitExpense[];
  participants: Omit<ProfitSplitParticipant, 'amount'>[];
}

export interface ProfitSplitCalculationResult {
  directExpenses: ProfitSplitExpense[];
  totalExpenses: number;
  netProfit: number;
  participants: ProfitSplitParticipant[];
  totalAllocatedPercentage: number;
  totalAllocatedAmount: number;
  unallocatedPercentage: number;
  unallocatedAmount: number;
}

export interface UpdateProfitSplitData {
  clientName?: string;
  clientEmail?: string;
  projectTitle?: string;
  grossRevenue?: number;
  directExpenses?: ProfitSplitExpense[];
  participants?: Omit<ProfitSplitParticipant, 'amount'>[];
}

export interface ProfitSplitEmployeeSummary {
  userId: string;
  userName: string;
  currency: Currency;
  totalAmount: number;
  leadAmount: number;
  salesAmount: number;
  managementAmount: number;
  deliveryAmount: number;
  projectCount: number;
}
