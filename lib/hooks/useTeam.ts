'use client';

import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/lib/hooks/usePortalAuth';
import { useResolvedOrgId } from '@/lib/hooks/useResolvedOrgId';
import { getOrganizationMembers, getInvitesByOrg } from '@/lib/services/portal-organizations';

export function useTeam() {
  const orgId = useResolvedOrgId();
  const { loading: auth, isAuthenticated } = usePortalAuth();

  const shouldFetch =
    isAuthenticated && !auth && orgId && typeof orgId === 'string' && orgId !== 'template';

  const {
    data: membersData = [],
    is: members,
    error: membersError,
  } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => getOrganizationMembers(orgId as string),
    enabled: Boolean(shouldFetch),
    refetchInterval: 30000,
    staleTime: 60 * 1000,
  });

  const {
    data: invitesData = [],
    is: invites,
    error: invitesError,
  } = useQuery({
    queryKey: ['org-invites', orgId],
    queryFn: () => getInvitesByOrg(orgId as string),
    enabled: Boolean(shouldFetch),
    refetchInterval: 30000,
    staleTime: 60 * 1000,
  });

  const loading = auth || (shouldFetch && (members || invites));
  const error =
    (membersError || invitesError) instanceof Error
      ? (membersError || invitesError)?.message
      : membersError || (invitesError as string | null);

  return {
    members: membersData,
    invites: invitesData,
    loading,
    error,
  };
}
