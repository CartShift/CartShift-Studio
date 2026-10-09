import { REQUEST_STATUS, type RequestStatus } from '@/lib/types/portal';

/**
 * Every request state has exactly one workboard column, including terminal states.
 * Group membership is intentionally independent of valid status transitions.
 */
export const WORKBOARD_STATUS_GROUPS = {
  backlog: [
    REQUEST_STATUS.DRAFT, REQUEST_STATUS.NEW, REQUEST_STATUS.NEEDS_INFO,
    REQUEST_STATUS.QUOTED, REQUEST_STATUS.CHANGES_REQUESTED,
    REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.QUEUED,
  ],
  in_progress: [REQUEST_STATUS.IN_PROGRESS],
  review: [REQUEST_STATUS.IN_REVIEW],
  delivered: [REQUEST_STATUS.DELIVERED, REQUEST_STATUS.PAID, REQUEST_STATUS.CLOSED],
  archived: [REQUEST_STATUS.CANCELED, REQUEST_STATUS.DECLINED, REQUEST_STATUS.EXPIRED],
} satisfies Record<string, RequestStatus[]>;

export const REQUEST_ALLOWED_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  DRAFT: ['NEW', 'QUOTED', 'CANCELED'],
  NEW: ['NEEDS_INFO', 'QUOTED', 'QUEUED', 'IN_PROGRESS', 'CANCELED'],
  NEEDS_INFO: ['NEW', 'QUOTED', 'QUEUED', 'IN_PROGRESS', 'CANCELED'],
  QUOTED: ['CHANGES_REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
  CHANGES_REQUESTED: ['QUOTED', 'CANCELED'],
  ACCEPTED: ['QUEUED', 'IN_PROGRESS', 'CANCELED'],
  DECLINED: [],
  QUEUED: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['IN_REVIEW', 'DELIVERED', 'CLOSED', 'CANCELED'],
  IN_REVIEW: ['IN_PROGRESS', 'DELIVERED', 'CLOSED', 'CANCELED'],
  DELIVERED: ['PAID', 'CLOSED', 'IN_PROGRESS'],
  PAID: ['CLOSED'],
  CLOSED: [],
  CANCELED: [],
  EXPIRED: [],
};

export function canTransitionRequest(from: RequestStatus, to: RequestStatus): boolean {
  return from === to || REQUEST_ALLOWED_TRANSITIONS[from]?.includes(to) === true;
}

export function getRequestWorkboardGroup(status: RequestStatus): keyof typeof WORKBOARD_STATUS_GROUPS {
  const found = (Object.keys(WORKBOARD_STATUS_GROUPS) as (keyof typeof WORKBOARD_STATUS_GROUPS)[])
    .find(key => (WORKBOARD_STATUS_GROUPS[key] as RequestStatus[]).includes(status));
  return found || 'backlog';
}
