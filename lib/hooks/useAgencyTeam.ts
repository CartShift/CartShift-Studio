'use client';

import { useQuery } from '@tanstack/react-query';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { queryKeys } from '@/lib/utils/query-keys';

export function useAgencyTeam() {
  return useQuery({
    queryKey: queryKeys.team.agency,
    queryFn: getAgencyTeam,
    staleTime: 5 * 60 * 1000,
  });
}
