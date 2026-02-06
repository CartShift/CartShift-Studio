export const queryKeys = {
  requests: {
    all: ['all-requests'] as const,
    byOrg: (orgId: string) => ['org-requests', orgId] as const,
    detail: (requestId: string) => ['request', requestId] as const,
    comments: (requestId: string, orgId: string) => ['request-comments', requestId, orgId] as const,
    activities: (requestId: string) => ['request-activities', requestId] as const,
    portal: ['portal-requests'] as const,
  },
  pricing: {
    allRequests: ['all-pricing-requests'] as const,
    byOrg: ['org-pricing-requests'] as const,
    config: (orgId: string, requestId?: string) =>
      requestId
        ? (['pricing-config', orgId, requestId] as const)
        : (['pricing-config', orgId] as const),
    results: (orgId: string) => ['pricing-results', orgId] as const,
  },
  organizations: {
    detail: (orgId: string) => ['organization', orgId] as const,
  },
  members: {
    byOrg: (orgId: string) => ['org-members', orgId] as const,
  },
  invites: {
    byOrg: (orgId: string) => ['org-invites', orgId] as const,
  },
  consultations: {
    byOrg: ['org-consultations'] as const,
    all: ['all-consultations'] as const,
  },
  team: {
    agency: ['agency-team'] as const,
  },
  sales: {
    metrics: ['sales-metrics'] as const,
    clientRevenue: ['client-revenue-data'] as const,
    monthlyRevenue: (months: number) => ['monthly-revenue', months] as const,
    topClients: (limit: number) => ['top-clients', limit] as const,
  },
  activities: {
    byOrg: (orgId: string) => ['org-activities', orgId] as const,
  },
} as const;
