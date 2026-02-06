'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import {
  getOrganizationMembers,
  getInvitesByOrg,
  subscribeToMembers,
  subscribeToInvites,
} from '@/lib/services/portal-organizations';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';
import { queryKeys } from '@/lib/utils/query-keys';
import { OrganizationMember, Invite } from '@/lib/types/portal';

export function useTeam() {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated } = usePortalAuth();
  const safeOrgId = typeof orgId === 'string' ? orgId : '';

  const shouldFetch = isAuthenticated && !auth && safeOrgId && safeOrgId !== 'template';

  const {
    data: membersData = [],
    isLoading: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: queryKeys.members.byOrg(safeOrgId),
    queryFn: () => getOrganizationMembers(safeOrgId),
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  const subscribeM = useMemo(
    () =>
      shouldFetch
        ? (cb: (data: OrganizationMember[]) => void) => subscribeToMembers(safeOrgId, cb)
        : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(queryKeys.members.byOrg(safeOrgId), subscribeM, Boolean(shouldFetch));

  const {
    data: invitesData = [],
    isLoading: invitesLoading,
    error: invitesError,
  } = useQuery({
    queryKey: queryKeys.invites.byOrg(safeOrgId),
    queryFn: () => getInvitesByOrg(safeOrgId),
    enabled: Boolean(shouldFetch),
    staleTime: Infinity,
  });

  const subscribeI = useMemo(
    () =>
      shouldFetch ? (cb: (data: Invite[]) => void) => subscribeToInvites(safeOrgId, cb) : null,
    [shouldFetch, safeOrgId]
  );
  useFirestoreSubscription(queryKeys.invites.byOrg(safeOrgId), subscribeI, Boolean(shouldFetch));

  const error =
    (membersError || invitesError) instanceof Error
      ? (membersError || invitesError)?.message
      : membersError || (invitesError as string | null);

  return {
    members: membersData,
    invites: invitesData,
    loading: auth || (shouldFetch && (membersLoading || invitesLoading)),
    error,
  };
}
