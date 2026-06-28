import type { Request, RequestRole, RequestStatus } from '@/lib/types/portal';

export const LEGACY_PROPOSAL_STATUS_MAP = {
  DRAFT: 'DRAFT',
  SENT: 'QUOTED',
  CLIENT_EDITED: 'CHANGES_REQUESTED',
  ACCEPTED: 'ACCEPTED',
  PAID: 'PAID',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CANCELED: 'CANCELED',
} as const satisfies Record<string, RequestStatus>;

export type LegacyProposalStatus = keyof typeof LEGACY_PROPOSAL_STATUS_MAP;

export function mapLegacyProposalStatus(status: unknown): RequestStatus {
  if (typeof status !== 'string') return 'DRAFT';
  return LEGACY_PROPOSAL_STATUS_MAP[status as LegacyProposalStatus] ?? (status as RequestStatus);
}

export function getRequestRole(
  request: Pick<Request, 'requestRole' | 'parentRequestId' | 'childRequestIds'>
): RequestRole {
  if (request.requestRole) return request.requestRole;
  if (request.parentRequestId) return 'bundle_item';
  if (request.childRequestIds?.length) return 'bundle';
  return 'standalone';
}

export function isCommercialParent(
  request: Pick<Request, 'requestRole' | 'parentRequestId'>
): boolean {
  return getRequestRole({ ...request, childRequestIds: undefined }) !== 'bundle_item';
}

export function getLegacyLinkedRequestIds(proposal: Record<string, unknown>): string[] {
  const materialized = Array.isArray(proposal.materializedRequestIds)
    ? proposal.materializedRequestIds
    : [];
  const linked = Array.isArray(proposal.requestIds) ? proposal.requestIds : [];
  return [
    ...new Set(
      [...materialized, ...linked].filter(
        (id): id is string => typeof id === 'string' && id.length > 0
      )
    ),
  ];
}

export function getCanonicalRequestIdentity(
  proposalId: string,
  proposal: Record<string, unknown>
): { requestId: string; requestRole: RequestRole; childRequestIds: string[] } {
  const childRequestIds = getLegacyLinkedRequestIds(proposal);
  if (childRequestIds.length === 1) {
    return { requestId: childRequestIds[0], requestRole: 'standalone', childRequestIds: [] };
  }
  if (childRequestIds.length > 1) {
    return { requestId: proposalId, requestRole: 'bundle', childRequestIds };
  }
  return { requestId: proposalId, requestRole: 'standalone', childRequestIds: [] };
}

export function isLockedCommercialRequest(request: Pick<Request, 'status' | 'lockedAt'>): boolean {
  return request.status === 'ACCEPTED' || request.status === 'PAID' || Boolean(request.lockedAt);
}

export function canAcceptCommercialRequest(
  request: Pick<Request, 'status' | 'validUntil'>,
  now = Date.now()
): boolean {
  const validUntil = request.validUntil?.toDate?.().getTime();
  return request.status === 'QUOTED' && (!validUntil || validUntil >= now);
}
