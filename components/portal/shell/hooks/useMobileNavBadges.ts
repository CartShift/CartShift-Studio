'use client';

import { useMemo } from 'react';
import { useRequests } from '@/lib/hooks/useRequests';
import { useConsultations } from '@/lib/hooks/useConsultations';
import { REQUEST_STATUS, CONSULTATION_STATUS } from '@/lib/types/portal';

export function useMobileNavBadges(isAgency: boolean, isMobile: boolean) {
  const { requests } = useRequests();
  const { consultations } = useConsultations();

  return useMemo(() => {
    if (!isMobile) {
      return {};
    }

    if (isAgency) {
      // Workboard: only NEW requests that need to be triaged/started
      const newRequestsCount = requests.filter(r => r.status === REQUEST_STATUS.NEW).length;

      return {
        workboard: newRequestsCount || undefined,
        clients: undefined,
        pricing: undefined, // Pricing offers use separate data source
      };
    }

    // Client: active requests they're waiting on
    const activeRequests = requests.filter(
      r =>
        r.status === REQUEST_STATUS.NEW ||
        r.status === REQUEST_STATUS.IN_PROGRESS ||
        r.status === REQUEST_STATUS.QUOTED
    ).length;

    // Client: upcoming scheduled consultations
    const upcomingConsultations = consultations.filter(
      c => c.status === CONSULTATION_STATUS.SCHEDULED
    ).length;

    return {
      requests: activeRequests || undefined,
      consultations: upcomingConsultations || undefined,
    };
  }, [isAgency, isMobile, requests, consultations]);
}
