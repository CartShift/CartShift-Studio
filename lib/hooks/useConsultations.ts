'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { getConsultationsByOrg, getAllConsultations } from '@/lib/services/portal-consultations';
import { ConsultationStatus } from '@/lib/types/portal';

interface UseConsultationsOptions {
  status?: ConsultationStatus | 'all';
}

export function useConsultations({ status = 'all' }: UseConsultationsOptions = {}) {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();

  const shouldFetch =
    isAuthenticated && !auth && (isAgency || (orgId && typeof orgId === 'string'));

  const queryKey = isAgency ? ['all-consultations', status] : ['org-consultations', orgId, status];

  const {
    data: consultations = [],
    isLoading: consultationsLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const statusFilter = status !== 'all' ? status : undefined;
      const options = statusFilter ? { status: statusFilter } : undefined;

      if (isAgency) {
        return getAllConsultations(options);
      } else {
        return getConsultationsByOrg(orgId as string, options);
      }
    },
    enabled: Boolean(shouldFetch),
    refetchInterval: 30000, // Poll every 30s
    staleTime: 60 * 1000,
  });

  const loading = auth || (shouldFetch && consultationsLoading);
  const errorMsg = error instanceof Error ? error.message : (error as string | null);

  return {
    consultations,
    loading,
    error: errorMsg,
  };
}
