import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/utils/query-keys';
import { testimonialKeys } from '@/lib/hooks/useTestimonials';

export type PortalCacheInvalidationOptions = {
  orgId?: string;
  requestId?: string;
  pricingId?: string;
};

/** Keeps request, dashboard, workboard, sales, and client lists in sync after portal mutations. */
export function invalidatePortalRequestData(
  queryClient: QueryClient,
  options: PortalCacheInvalidationOptions = {}
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
  queryClient.invalidateQueries({ queryKey: queryKeys.requests.portal });

  if (options.orgId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.byOrg(options.orgId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.activities.byOrg(options.orgId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.pricing.byOrg });
  }

  if (options.requestId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(options.requestId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.activities.byRequest(options.requestId),
    });
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.agencyClients });
  queryClient.invalidateQueries({ queryKey: queryKeys.sales.metrics });
  queryClient.invalidateQueries({ queryKey: queryKeys.sales.clientRevenue });
}

export function invalidatePortalPricingData(
  queryClient: QueryClient,
  options: PortalCacheInvalidationOptions = {}
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.pricing.byOrg });
  queryClient.invalidateQueries({ queryKey: queryKeys.pricing.allRequests });

  if (options.pricingId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.pricing.detail(options.pricingId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.requests.detail(options.pricingId) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.requests.commercialPayments(options.pricingId),
    });
  }

  invalidatePortalRequestData(queryClient, options);
}

export function invalidatePortalTeamData(queryClient: QueryClient, orgId?: string) {
  if (orgId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.members.byOrg(orgId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.invites.byOrg(orgId) });
  }
  queryClient.invalidateQueries({ queryKey: queryKeys.team.agency });
}

export function invalidatePortalTestimonialData(
  queryClient: QueryClient,
  orgId?: string
) {
  queryClient.invalidateQueries({ queryKey: testimonialKeys.all });
  if (orgId) {
    queryClient.invalidateQueries({ queryKey: testimonialKeys.byOrg(orgId) });
    queryClient.invalidateQueries({ queryKey: testimonialKeys.hasSubmitted(orgId) });
  }
}
