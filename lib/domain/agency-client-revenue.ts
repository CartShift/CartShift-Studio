import type { ClientRevenueData, Currency } from '@/lib/types/portal';

/**
 * Preserve the old client-list ordering and defaults while avoiding repeated
 * O(clients × revenue rows) searches on each render.
 */
export function mergeAgencyClientRevenue<T extends { id: string; defaultCurrency?: Currency }>(
  organizations: readonly T[],
  revenue: readonly (Pick<ClientRevenueData, 'orgId' | 'totalRevenue' | 'pendingRevenue' | 'paidCount'> &
    Partial<Pick<ClientRevenueData, 'currency' | 'hasOtherCurrencies'>>)[],
): Array<T & { totalRevenue: number; pendingRevenue: number; paidCount: number;
  revenueCurrency?: Currency; hasOtherCurrencies?: boolean }> {
  const revenueByOrganization = new Map<string, typeof revenue[number]>();
  for (const row of revenue) {
    if (!revenueByOrganization.has(row.orgId)) revenueByOrganization.set(row.orgId, row);
  }

  return organizations
    .map(org => {
      const record = revenueByOrganization.get(org.id);
      return {
        ...org,
        totalRevenue: record?.totalRevenue ?? 0,
        pendingRevenue: record?.pendingRevenue ?? 0,
        paidCount: record?.paidCount ?? 0,
        revenueCurrency: record?.currency ?? org.defaultCurrency,
        hasOtherCurrencies: record?.hasOtherCurrencies ?? false,
      };
    })
    .sort((a, b) => {
      const left = a.revenueCurrency || 'ILS';
      const right = b.revenueCurrency || 'ILS';
      return left.localeCompare(right) || b.totalRevenue - a.totalRevenue;
    });
}
