export const queryKeys = {
  requests: {
    all: ['all-requests'] as const,
    byOrg: (orgId: string) => ['org-requests', orgId] as const,
    detail: (requestId: string) => ['request', requestId] as const,
    comments: (requestId: string, orgId?: string) =>
      orgId
        ? (['request-comments', requestId, orgId] as const)
        : (['request-comments', requestId] as const),
    portal: ['portal-requests'] as const,
    payments: (requestId: string) => ['request-payments', requestId] as const,
  },
  pricing: {
    allRequests: ['all-pricing-requests'] as const,
    byOrg: ['org-pricing-requests'] as const,
    detail: (pricingId: string) => ['pricing-request', pricingId] as const,
    payments: (pricingId: string) => ['proposal-payments', pricingId] as const,
    config: (orgId: string, requestId?: string) =>
      requestId
        ? (['pricing-config', orgId, requestId] as const)
        : (['pricing-config', orgId] as const),
    results: (orgId: string) => ['pricing-results', orgId] as const,
  },
  organizations: {
    detail: (orgId: string) => ['organization', orgId] as const,
    byUser: (userId: string) => ['user-organizations', userId] as const,
  },
  files: {
    byOrg: (orgId: string) => ['org-files', orgId] as const,
  },
  agency: {
    profile: (agencyId: string) => ['agency-profile', agencyId] as const,
  },
  services: {
    agency: ['agency-services'] as const,
  },
  members: {
    byOrg: (orgId: string) => ['org-members', orgId] as const,
  },
  invites: {
    byOrg: (orgId: string) => ['org-invites', orgId] as const,
    agency: ['agency-invites'] as const,
  },
  consultations: {
    byOrg: (orgId?: string, status?: string) =>
      orgId
        ? status
          ? (['org-consultations', orgId, status] as const)
          : (['org-consultations', orgId] as const)
        : (['org-consultations'] as const),
    all: (status?: string) =>
      status ? (['all-consultations', status] as const) : (['all-consultations'] as const),
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
  profitSplits: {
    all: ['profit-splits'] as const,
    paidPricingRequests: ['profit-splits-paid-pricing-requests'] as const,
    detail: (id: string) => ['profit-split', id] as const,
    byPricingRequest: (pricingRequestId: string) =>
      ['profit-split-by-pricing-request', pricingRequestId] as const,
  },
  marketing: {
    dashboard: ['marketing-dashboard'] as const,
    leadJobs: (leadId: string) => ['marketing-lead-jobs', leadId] as const,
  },
  activities: {
    byOrg: (orgId: string) => ['org-activities', orgId] as const,
    byRequest: (requestId: string) => ['request-activities', requestId] as const,
  },
  agencyClients: ['agency-clients'] as const,
} as const;
