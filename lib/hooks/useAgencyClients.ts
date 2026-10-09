'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { canAccessNav, PERMISSIONS } from '@/lib/utils/permissions';
import { getOrganizationsWithStats } from '@/lib/services/portal-organizations';
import { getClientRevenueData } from '@/lib/services/portal-sales';
import { Organization, ClientRevenueData } from '@/lib/types/portal';
import { queryKeys } from '@/lib/utils/query-keys';

export type EnhancedOrganization = Organization & {
  memberCount: number;
  requestCount: number;
  totalRevenue?: number;
  pendingRevenue?: number;
  paidCount?: number;
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

  const enhancedOrganizations: EnhancedOrganization[] = organizations.map(org => {
    const revenue = revenueData.find(r => r.orgId === org.id);
    return {
      ...org,
      totalRevenue: revenue?.totalRevenue || 0,
      pendingRevenue: revenue?.pendingRevenue || 0,
      paidCount: revenue?.paidCount || 0,
    };
  });

  enhancedOrganizations.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));

  return {
    organizations: enhancedOrganizations,
    loading: auth || (shouldFetch && (isLoadingOrgs || (canViewRevenue && isLoadingRevenue))),
    error: orgsError instanceof Error ? orgsError.message : (orgsError as string | null),
    userData,
  };
}
