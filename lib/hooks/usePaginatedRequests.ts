'use client';

import { useMemo } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import {
  getPortalRequestPage,
  type RequestPageCursor,
} from '@/lib/services/portal-request-pages';
import type { RequestStatus } from '@/lib/types/portal';

/**
 * Opt-in cursor API for screens that support server-paged results.
 * The existing complete dashboard request streams are intentionally unchanged:
 * local search and aggregate counts must not silently become incomplete.
 */
export function usePaginatedRequests({
  orgId,
  statuses,
  pageSize = 30,
  enabled = true,
}: {
  orgId?: string;
  statuses?: readonly RequestStatus[];
  pageSize?: number;
  enabled?: boolean;
}) {
  const { loading: authLoading, isAuthenticated, isAgency } = usePortalAuth();
  const sortedStatuses = useMemo(
    () => [...new Set(statuses ?? [])].sort(),
    [JSON.stringify(statuses ?? [])]
  );
  const canFetch = enabled && !authLoading && isAuthenticated && (Boolean(orgId) || isAgency);

  return useInfiniteQuery({
    queryKey: ['portal', 'request-pages', orgId ?? 'agency', sortedStatuses, pageSize],
    queryFn: ({ pageParam }) => getPortalRequestPage({
      orgId, statuses: sortedStatuses, pageSize, cursor: pageParam,
    }),
    initialPageParam: null as RequestPageCursor | null,
    getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
    enabled: canFetch,
    staleTime: 30_000,
  });
}
