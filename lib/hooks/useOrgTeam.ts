'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import {
  getOrganizationMembers,
  getInvitesByOrg,
  subscribeToMembers,
  subscribeToInvites,
} from '@/lib/services/portal-organizations';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import type { OrganizationMember, Invite } from '@/lib/types/portal';

export function useOrgTeam(orgId: string | undefined, options?: { enabled?: boolean }) {
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' && orgId ? orgId : '';
  const enabled = options?.enabled ?? true;
  const shouldFetch =
    isAuthenticated && !auth && Boolean(safeOrgId) && safeOrgId !== 'template' && enabled;

  const {
    data: members = [],
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: queryKeys.members.byOrg(safeOrgId),
    queryFn: () => getOrganizationMembers(safeOrgId),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribeM = useMemo(
    () =>
      shouldFetch
        ? (cb: (data: OrganizationMember[]) => void) => subscribeToMembers(safeOrgId, cb)
        : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(queryKeys.members.byOrg(safeOrgId), subscribeM, shouldFetch);

  const {
    data: invites = [],
    isLoading: invitesLoading,
    error: invitesError,
  } = useQuery({
    queryKey: queryKeys.invites.byOrg(safeOrgId),
    queryFn: () => getInvitesByOrg(safeOrgId),
    enabled: shouldFetch,
    staleTime: Infinity,
  });

  const subscribeI = useMemo(
    () =>
      shouldFetch ? (cb: (data: Invite[]) => void) => subscribeToInvites(safeOrgId, cb) : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(queryKeys.invites.byOrg(safeOrgId), subscribeI, shouldFetch);

  const error =
    (membersError || invitesError) instanceof Error
      ? (membersError || invitesError)?.message
      : membersError || (invitesError as string | null);

  return {
    members,
    invites,
    loading: auth || (shouldFetch && (membersLoading || invitesLoading)),
    error,
  };
}
