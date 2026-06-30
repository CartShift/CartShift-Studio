import 'server-only';

import { dehydrate, DehydratedState } from '@tanstack/react-query';
import { createAppQueryClient } from '@/lib/query/query-client-config';
import {
  serverGetAllRequests,
  serverGetOrgActivities,
  serverGetOrgInvites,
  serverGetOrgMembers,
  serverGetOrganization,
  serverGetRequest,
  serverGetRequestActivities,
  serverGetRequestsByOrg,
} from '@/lib/server/portal-data';
import { getPortalSessionContext } from '@/lib/server/portal-session-context';
import { queryKeys } from '@/lib/utils/query-keys';

export type PortalPrefetchScope =
  | 'dashboard'
  | 'requests'
  | 'workboard'
  | 'request-detail'
  | 'team'
  | 'settings';

export async function prefetchPortalPageData(
  scope: PortalPrefetchScope,
  options?: { requestId?: string }
): Promise<DehydratedState | undefined> {
  const context = await getPortalSessionContext();
  if (!context) {
    return undefined;
  }

  const queryClient = createAppQueryClient();

  try {
    await prefetchPortalQueries(queryClient, context, scope, options);
  } catch (error) {
    console.error('[prefetchPortalPageData] Prefetch failed:', error);
    return undefined;
  }

  if (queryClient.getQueryCache().getAll().length === 0) {
    return undefined;
  }

  return dehydrate(queryClient);
}

async function prefetchPortalQueries(
  queryClient: ReturnType<typeof createAppQueryClient>,
  context: NonNullable<Awaited<ReturnType<typeof getPortalSessionContext>>>,
  scope: PortalPrefetchScope,
  options?: { requestId?: string }
): Promise<void> {
  if (context.isAgency) {
    if (scope === 'dashboard' || scope === 'requests' || scope === 'workboard') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.requests.all,
        queryFn: serverGetAllRequests,
      });
    }
  } else if (context.orgId) {
    const orgId = context.orgId;

    if (scope === 'dashboard' || scope === 'requests' || scope === 'workboard') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.requests.byOrg(orgId),
        queryFn: () => serverGetRequestsByOrg(orgId),
      });
    }

    if (scope === 'dashboard') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.activities.byOrg(orgId),
        queryFn: () => serverGetOrgActivities(orgId),
      });
    }

    if (scope === 'team') {
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.members.byOrg(orgId),
          queryFn: () => serverGetOrgMembers(orgId),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.invites.byOrg(orgId),
          queryFn: () => serverGetOrgInvites(orgId),
        }),
      ]);
    }

    if (scope === 'settings') {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.organizations.detail(orgId),
        queryFn: () => serverGetOrganization(orgId),
      });
    }
  }

  if (scope === 'request-detail' && options?.requestId) {
    const requestId = options.requestId;
    const request = await serverGetRequest(requestId);
    if (request) {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.requests.detail(requestId),
        queryFn: () => Promise.resolve(request),
      });

      await queryClient.prefetchQuery({
        queryKey: queryKeys.activities.byRequest(requestId),
        queryFn: () => serverGetRequestActivities(requestId),
      });
    }
  }
}
