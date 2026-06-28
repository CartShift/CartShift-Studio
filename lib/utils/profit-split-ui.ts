import { formatCurrency, Currency } from '@/lib/types/pricing';
import {
  PROFIT_SPLIT_ROLE,
  ProfitSplit,
  ProfitSplitEmployeeSummary,
  ProfitSplitParticipant,
  ProfitSplitRole,
} from '@/lib/types/profit-split';

export const roleOrder: ProfitSplitRole[] = [
  PROFIT_SPLIT_ROLE.LEAD,
  PROFIT_SPLIT_ROLE.SALES,
  PROFIT_SPLIT_ROLE.MANAGEMENT,
  PROFIT_SPLIT_ROLE.DELIVERY,
];

export function generateLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function centsFromInput(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

export function dateLabel(timestamp: ProfitSplit['updatedAt'] | undefined, locale: string): string {
  if (!timestamp?.toDate) return '';
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(timestamp.toDate());
}

export function getEditableParticipants(
  split: ProfitSplit
): Omit<ProfitSplitParticipant, 'amount'>[] {
  return split.participants.map(({ amount: _amount, ...participant }) => participant);
}

export function buildEmployeeSummary(splits: ProfitSplit[]): ProfitSplitEmployeeSummary[] {
  const summaries = new Map<string, ProfitSplitEmployeeSummary & { projects: Set<string> }>();

  for (const split of splits) {
    for (const participant of split.participants) {
      if (!participant.userId) continue;
      const summaryKey = `${participant.userId}:${split.currency}`;
      const existing =
        summaries.get(summaryKey) ??
        ({
          userId: participant.userId,
          userName: participant.userName,
          currency: split.currency,
          totalAmount: 0,
          leadAmount: 0,
          salesAmount: 0,
          managementAmount: 0,
          deliveryAmount: 0,
          projectCount: 0,
          projects: new Set<string>(),
        } satisfies ProfitSplitEmployeeSummary & { projects: Set<string> });

      existing.userName = participant.userName || existing.userName;
      existing.totalAmount += participant.amount;
      existing.projects.add(split.id);

      if (participant.role === PROFIT_SPLIT_ROLE.LEAD) existing.leadAmount += participant.amount;
      if (participant.role === PROFIT_SPLIT_ROLE.SALES) existing.salesAmount += participant.amount;
      if (participant.role === PROFIT_SPLIT_ROLE.MANAGEMENT) {
        existing.managementAmount += participant.amount;
      }
      if (participant.role === PROFIT_SPLIT_ROLE.DELIVERY) {
        existing.deliveryAmount += participant.amount;
      }

      summaries.set(summaryKey, existing);
    }
  }

  return Array.from(summaries.values())
    .map(({ projects, ...summary }) => ({ ...summary, projectCount: projects.size }))
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

export function formatCurrencyBreakdown(
  totals: Partial<Record<Currency, number>>,
  fallbackCurrency: Currency
): string {
  const entries = Object.entries(totals) as [Currency, number][];
  if (entries.length === 0) return formatCurrency(0, fallbackCurrency);
  return entries.map(([currency, total]) => formatCurrency(total, currency)).join(' · ');
}

export function summarizeByCurrency(
  splits: ProfitSplit[],
  getAmount: (split: ProfitSplit) => number
): Partial<Record<Currency, number>> {
  return splits.reduce<Partial<Record<Currency, number>>>((totals, split) => {
    totals[split.currency] = (totals[split.currency] ?? 0) + getAmount(split);
    return totals;
  }, {});
}

export function allocationTone(split: ProfitSplit) {
  if (split.netProfit < 0) return 'danger';
  if (split.totalAllocatedPercentage === 100) return 'success';
  if (split.totalAllocatedPercentage > 100) return 'danger';
  return 'warning';
}
