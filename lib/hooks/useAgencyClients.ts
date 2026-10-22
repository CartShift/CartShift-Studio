'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { canAccessNav, PERMISSIONS } from '@/lib/utils/permissions';
import { getOrganizationsWithStats } from '@/lib/services/portal-organizations';
import { getClientRevenueData } from '@/lib/services/portal-sales';
import { Organization, ClientRevenueData, Currency } from '@/lib/types/portal';
import { queryKeys } from '@/lib/utils/query-keys';
import { mergeAgencyClientRevenue } from '@/lib/domain/agency-client-revenue';
import { listAgencyClientWorkModes } from '@/lib/services/agency-work-modes';
import type { WorkMode } from '@/lib/domain/work-engagement';

export type EnhancedOrganization = Organization & {
  memberCount: number;
  requestCount: number;
  totalRevenue?: number;
  pendingRevenue?: number;
  paidCount?: number;
  revenueCurrency?: Currency;
  hasOtherCurrencies?: boolean;
  /** Agency-only commercial classification, never a proxy for paid invoices. */
  defaultWorkMode?: WorkMode;
};

export function useAgencyClients() {
  const { loading: auth, isAgency, userData } = usePortalAuth();
  const shouldFetch = !auth && isAgency;
  const canViewRevenue = canAccessNav(userData?.agencyRole || 'owner', PERMISSIONS.VIEW_SALES_DASHBOARD);

  const {
    data: organizations = [],
    isLoading: isLoadingOrgs,
    error: orgsError,
  } = useQuery({
    queryKey: queryKeys.agencyClients,
    queryFn: getOrganizationsWithStats,
    enabled: Boolean(shouldFetch),
    staleTime: 5 * 60 * 1000,
  });

  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery<ClientRevenueData[]>({
    queryKey: queryKeys.sales.clientRevenue,
    queryFn: getClientRevenueData,
    enabled: Boolean(shouldFetch && canViewRevenue),
    staleTime: 5 * 60 * 1000,
  });

  const { data: workModes = [], isLoading: loadingModes, error: modesError } = useQuery({
    queryKey: ['agency-client-work-modes'],
    queryFn: listAgencyClientWorkModes,
    enabled: Boolean(shouldFetch && canViewRevenue),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const enhancedOrganizations: EnhancedOrganization[] = useMemo(() => {
    const byOrg = new Map(workModes.map(mode => [mode.orgId, mode.defaultWorkMode]));
    return mergeAgencyClientRevenue(organizations, revenueData).map(org => ({
      ...org,
      // Empty metadata means commercial DEFAULT, not a verified paying customer.
      defaultWorkMode: byOrg.get(org.id) ?? 'commercial',
    }));
  }, [organizations, revenueData, workModes]);

  return {
    organizations: enhancedOrganizations,
    loading: auth || (shouldFetch && (isLoadingOrgs || (canViewRevenue && (isLoadingRevenue || loadingModes)))),
    error: orgsError instanceof Error ? orgsError.message : (modesError instanceof Error ? modesError.message : (orgsError as string | null)),
    userData,
  };
}
