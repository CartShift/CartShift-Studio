'use client';

import { useQuery } from '@tanstack/react-query';
import { listClientProjects } from '@/lib/services/portal-projects';

export function useClientProjects(orgId?: string) {
  return useQuery({
    queryKey: ['client-projects', orgId],
    queryFn: () => listClientProjects(orgId!),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });
}
