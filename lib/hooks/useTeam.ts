'use client';

import { useOrgTeam } from '@/lib/hooks/useOrgTeam';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';

export function useTeam() {
  const orgId = useResolvedOrgId();
  return useOrgTeam(typeof orgId === 'string' ? orgId : undefined);
}
