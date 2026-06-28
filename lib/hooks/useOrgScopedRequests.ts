'use client';

import { useRequests, type UseRequestsOptions } from '@/lib/hooks/useRequests';

/** Org-scoped requests for agency client detail and similar views */
export function useOrgScopedRequests(orgId: string | undefined, options?: { enabled?: boolean }) {
  return useRequests({ orgId, enabled: options?.enabled });
}

export type { UseRequestsOptions };
