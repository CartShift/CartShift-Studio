'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRequest } from '@/lib/services/portal-requests';
import { getCommentsByRequest } from '@/lib/services/portal-comments';
import { getRequestActivities } from '@/lib/services/portal-activities';
import { getOrganization } from '@/lib/services/portal-organizations';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useResolvedRequestId } from '@/lib/hooks/useResolvedRequestId';
import { Request, Comment, Organization, ActivityLog, PortalUser } from '@/lib/types/portal';

export interface UseRequestDetailResult {
  // Data
  request: Request | null;
  comments: Comment[];
  activities: ActivityLog[];
  organization: Organization | null;
  agencyTeam: PortalUser[];

  // Auth & IDs
  userData: PortalUser | null;
  isAgency: boolean;
  orgId: string | null;
  requestId: string | null;

  // State
  loading: boolean;
  error: string | null;

  // Derived permissions
  canAct: boolean;
  showAgencyActions: boolean;
  showClientActions: boolean;

  // Comment state update (for optimistic updates)
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

/**
 * Hook for fetching and subscribing to request detail data.
 * Refactored to use @tanstack/react-query due to superior caching and background refetching.
 */
export function useRequestDetail(): UseRequestDetailResult {
  const orgId = useResolvedOrgId();
  const requestId = useResolvedRequestId();
  const { userData, isAgency, loading: auth, isAuthenticated } = usePortalAuth();
  const queryClient = useQueryClient();

  const enabled = Boolean(isAuthenticated && requestId && typeof requestId === 'string');

  // 1. Request Detail
  const {
    data: request,
    is: request,
    error: requestError,
  } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => getRequest(requestId as string),
    enabled,
    staleTime: 1000 * 60, // 1 minute stale time to prevent immediate refetch on navigation
  });

  // 2. Comments
  const { data: comments = [] } = useQuery({
    queryKey: ['request-comments', requestId, orgId],
    queryFn: () =>
      getCommentsByRequest(
        requestId as string,
        Boolean(userData?.isAgency),
        typeof orgId === 'string' ? orgId : undefined
      ),
    enabled, // orgId is optional - comments are already linked to requestId
    refetchInterval: 5000, // Poll every 5s for new comments (simulating real-time lite)
  });

  // 3. Activities
  const { data: activities = [] } = useQuery({
    queryKey: ['request-activities', requestId],
    queryFn: () =>
      getRequestActivities(requestId as string, typeof orgId === 'string' ? orgId : undefined),
    enabled: enabled && Boolean(orgId),
    refetchInterval: 10000, // Poll every 10s for activities
  });

  // 4. Organization (Static-ish)
  const { data: organization } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => getOrganization(orgId as string),
    enabled: Boolean(orgId && typeof orgId === 'string' && isAuthenticated),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // 5. Agency Team (Static-ish)
  const { data: agencyTeam = [] } = useQuery({
    queryKey: ['agency-team'],
    queryFn: getAgencyTeam,
    enabled: Boolean(isAgency && isAuthenticated),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper to update comments optimistically or manually
  // This bridges the gap for components expecting setComments
  const setComments = (action: React.SetStateAction<Comment[]>) => {
    // We need to match the key used in useQuery above: ['request-comments', requestId, orgId]
    queryClient.setQueryData<Comment[]>(['request-comments', requestId, orgId], oldData => {
      const current = oldData || [];
      if (typeof action === 'function') {
        return action(current);
      }
      return action;
    });
  };

  // Derived permissions
  const canAct = Boolean(userData);
  const showAgencyActions = canAct && isAgency;
  const showClientActions = canAct && !isAgency;

  const errorMsg =
    requestError instanceof Error ? requestError.message : (requestError as string | null);

  return {
    request: request || null,
    comments,
    activities,
    organization: organization || null,
    agencyTeam,
    userData: userData as PortalUser | null,
    isAgency,
    orgId: typeof orgId === 'string' ? orgId : null,
    requestId: typeof requestId === 'string' ? requestId : null,
    loading: auth || request,
    error: errorMsg,
    canAct,
    showAgencyActions,
    showClientActions,
    setComments,
  };
}
