'use client';

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRequest } from '@/lib/services/portal-requests';
import { getCommentsByRequest, subscribeToRequestComments } from '@/lib/services/portal-comments';
import {
  getRequestActivities,
  subscribeToRequestActivities,
} from '@/lib/services/portal-activities';
import { getOrganization } from '@/lib/services/portal-organizations';
import { getAgencyTeam } from '@/lib/services/portal-agency';
import { subscribeToRequest } from '@/lib/services/portal-requests';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { useResolvedRequestId } from '@/lib/hooks/useResolvedRequestId';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import { Request, Comment, Organization, ActivityLog, PortalUser } from '@/lib/types/portal';

export interface UseRequestDetailResult {
  request: Request | null;
  comments: Comment[];
  activities: ActivityLog[];
  organization: Organization | null;
  clientOrganization: Organization | null;
  agencyTeam: PortalUser[];
  userData: PortalUser | null;
  isAgency: boolean;
  orgId: string | null;
  requestId: string | null;
  loading: boolean;
  error: string | null;
  canAct: boolean;
  showAgencyActions: boolean;
  showClientActions: boolean;
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
}

export function useRequestDetail(): UseRequestDetailResult {
  const orgId = useResolvedOrgId();
  const requestId = useResolvedRequestId();
  const { userData, isAgency, loading: auth, isAuthenticated } = usePortalAuth();
  const queryClient = useQueryClient();

  const enabled = Boolean(isAuthenticated && requestId && typeof requestId === 'string');
  const safeRequestId = typeof requestId === 'string' ? requestId : '';
  const safeOrgId = typeof orgId === 'string' ? orgId : '';

  // 1. Request Detail (initial fetch + real-time)
  const {
    data: request,
    isLoading: requestLoading,
    error: requestError,
  } = useQuery({
    queryKey: queryKeys.requests.detail(safeRequestId),
    queryFn: () => getRequest(safeRequestId),
    enabled,
    staleTime: Infinity,
  });

  const subscribeRequest = useMemo(
    () =>
      enabled
        ? (cb: (data: Request | null) => void) => subscribeToRequest(safeRequestId, cb)
        : null,
    [safeRequestId, enabled]
  );
  useFirestoreSubscription(queryKeys.requests.detail(safeRequestId), subscribeRequest, enabled);

  // 2. Comments (real-time via onSnapshot)
  const { data: comments = [] } = useQuery({
    queryKey: queryKeys.requests.comments(safeRequestId, safeOrgId),
    queryFn: () =>
      getCommentsByRequest(safeRequestId, Boolean(userData?.isAgency), safeOrgId || undefined),
    enabled,
    staleTime: Infinity,
  });

  const subscribeComments = useMemo(
    () =>
      enabled
        ? (cb: (data: Comment[]) => void) =>
            subscribeToRequestComments(
              safeRequestId,
              cb,
              Boolean(userData?.isAgency),
              safeOrgId || undefined
            )
        : null,
    [safeRequestId, safeOrgId, enabled, userData?.isAgency]
  );
  useFirestoreSubscription(
    queryKeys.requests.comments(safeRequestId, safeOrgId),
    subscribeComments,
    enabled
  );

  // 3. Activities (real-time via onSnapshot)
  const activitiesEnabled = enabled && Boolean(orgId);
  const { data: activities = [] } = useQuery({
    queryKey: queryKeys.activities.byRequest(safeRequestId),
    queryFn: () => getRequestActivities(safeRequestId, safeOrgId || undefined),
    enabled: activitiesEnabled,
    staleTime: Infinity,
  });

  const subscribeActivities = useMemo(
    () =>
      activitiesEnabled
        ? (cb: (data: ActivityLog[]) => void) =>
            subscribeToRequestActivities(safeRequestId, cb, safeOrgId || undefined)
        : null,
    [safeRequestId, safeOrgId, activitiesEnabled]
  );
  useFirestoreSubscription(
    queryKeys.activities.byRequest(safeRequestId),
    subscribeActivities,
    activitiesEnabled
  );

  // 4. Organization (static-ish, no subscription needed)
  const { data: organization } = useQuery({
    queryKey: queryKeys.organizations.detail(safeOrgId),
    queryFn: () => getOrganization(safeOrgId),
    enabled: Boolean(safeOrgId && isAuthenticated),
    staleTime: 1000 * 60 * 5,
  });

  // 5. Agency Team (static-ish)
  const { data: agencyTeam = [] } = useQuery({
    queryKey: queryKeys.team.agency,
    queryFn: getAgencyTeam,
    enabled: Boolean(isAgency && isAuthenticated),
    staleTime: 1000 * 60 * 5,
  });

  // 6. Client Organization
  const { data: clientOrganization } = useQuery({
    queryKey: queryKeys.organizations.detail(request?.orgId || ''),
    queryFn: () => getOrganization(request!.orgId),
    enabled: Boolean(request?.orgId && isAuthenticated),
    staleTime: 1000 * 60 * 5,
  });

  const setComments = useCallback(
    (action: React.SetStateAction<Comment[]>) => {
      queryClient.setQueryData<Comment[]>(
        queryKeys.requests.comments(safeRequestId, safeOrgId),
        oldData => {
          const current = oldData || [];
          return typeof action === 'function' ? action(current) : action;
        }
      );
    },
    [queryClient, safeRequestId, safeOrgId]
  );

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
    clientOrganization: clientOrganization || null,
    agencyTeam,
    userData: userData as PortalUser | null,
    isAgency,
    orgId: safeOrgId || null,
    requestId: safeRequestId || null,
    loading: auth || requestLoading,
    error: errorMsg,
    canAct,
    showAgencyActions,
    showClientActions,
    setComments,
  };
}
