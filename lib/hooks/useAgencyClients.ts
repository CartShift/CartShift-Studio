'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { getOrganizationsWithStats } from '@/lib/services/portal-organizations';
import { getClientRevenueData } from '@/lib/services/portal-sales';
import { Organization, ClientRevenueData } from '@/lib/types/portal';

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

  const {
    data: organizations = [],
    isLoading: isLoadingOrgs,
    error: orgsError,
  } = useQuery({
    queryKey: ['agency-clients'],
    queryFn: getOrganizationsWithStats,
    enabled: Boolean(shouldFetch),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: revenueData = [], isLoading: isLoadingRevenue } = useQuery<ClientRevenueData[]>({
    queryKey: ['client-revenue-data'],
    queryFn: getClientRevenueData,
    enabled: Boolean(shouldFetch),
    staleTime: 5 * 60 * 1000,
  });

  // Merge revenue data into organizations
  const enhancedOrganizations: EnhancedOrganization[] = organizations.map(org => {
    const revenue = revenueData.find(r => r.orgId === org.id);
    return {
      ...org,
      totalRevenue: revenue?.totalRevenue || 0,
      pendingRevenue: revenue?.pendingRevenue || 0,
      paidCount: revenue?.paidCount || 0,
    };
  });

  // Sort by revenue descending (clients with most revenue first)
  enhancedOrganizations.sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0));

  return {
    organizations: enhancedOrganizations,
    loading: auth || (shouldFetch && (isLoadingOrgs || isLoadingRevenue)),
    error: orgsError instanceof Error ? orgsError.message : (orgsError as string | null),
    userData,
  };
}
