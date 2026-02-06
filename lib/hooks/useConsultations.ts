'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import {
  getConsultationsByOrg,
  getAllConsultations,
  subscribeToOrgConsultations,
  subscribeToAllConsultations,
} from '@/lib/services/portal-consultations';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import { Consultation, ConsultationStatus } from '@/lib/types/portal';

interface UseConsultationsOptions {
  status?: ConsultationStatus | 'all';
}

export function useConsultations({ status = 'all' }: UseConsultationsOptions = {}) {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated, isAgency } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' ? orgId : '';

  const shouldFetch = isAuthenticated && !auth && (isAgency || Boolean(safeOrgId));
  const statusFilter = status !== 'all' ? status : undefined;

  const qKey = isAgency
    ? queryKeys.consultations.all(statusFilter)
    : queryKeys.consultations.byOrg(safeOrgId, statusFilter);

  const {
    data: consultations = [],
    isLoading: consultationsLoading,
    error,
  } = useQuery({
    queryKey: qKey,
    queryFn: () => {
      const options = statusFilter ? { status: statusFilter } : undefined;
      return isAgency ? getAllConsultations(options) : getConsultationsByOrg(safeOrgId, options);
    },
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  // Real-time subscription replaces polling
  const subscribe = useMemo(() => {
    if (!shouldFetch) return null;
    return isAgency
      ? (cb: (data: Consultation[]) => void) => subscribeToAllConsultations(cb)
      : (cb: (data: Consultation[]) => void) => subscribeToOrgConsultations(safeOrgId, cb);
  }, [shouldFetch, isAgency, safeOrgId]);

  useFirestoreSubscription(qKey, subscribe, Boolean(shouldFetch));

  return {
    consultations,
    loading: auth || (shouldFetch && consultationsLoading),
    error: error instanceof Error ? error.message : (error as string | null),
  };
}
