'use client';

import { useQuery } from '@tanstack/react-query';
import { getAllOrganizations, getUserOrganizations } from '@/lib/services/portal-organizations';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { queryKeys } from '@/lib/utils/query-keys';

export function useUserOrganizations() {
  const { userData, loading: auth, isAuthenticated, isAgency } = usePortalAuth();
  const userId = userData?.id ?? '';

  const shouldFetch = isAuthenticated && !auth && Boolean(userId);

  return useQuery({
    queryKey: [...queryKeys.organizations.byUser(userId), isAgency ? 'agency' : 'client'],
    queryFn: () => isAgency ? getAllOrganizations() : getUserOrganizations(userId),
    enabled: shouldFetch,
    staleTime: 5 * 60 * 1000,
  });
}
