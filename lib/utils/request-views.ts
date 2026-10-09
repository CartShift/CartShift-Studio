import type { Request } from '@/lib/types/portal';

type ViewableRequest = Pick<Request, 'status' | 'isBillable' | 'publicToken' | 'requestRole' | 'tags'>;

/** Display groupings are presentation only: canonical request statuses never change. */
export const AGENCY_REQUEST_VIEWS: Record<string, readonly string[]> = {
  attention: ['NEW', 'NEEDS_INFO', 'CHANGES_REQUESTED', 'IN_REVIEW'],
  working: ['ACCEPTED', 'QUEUED', 'IN_PROGRESS'],
  waiting: ['QUOTED'],
  done: ['DELIVERED', 'PAID', 'CLOSED', 'CANCELED', 'DECLINED', 'EXPIRED'],
  proposals: [],
};

export function matchesAgencyRequestView(request: ViewableRequest, view: string): boolean {
  if (view === 'All') return true;
  if (view === 'proposals') {
    return Boolean(
      request.isBillable || request.publicToken || request.requestRole === 'bundle' || request.tags?.includes('quote')
    );
  }
  const group = AGENCY_REQUEST_VIEWS[view];
  return group ? group.includes(request.status) : request.status === view;
}
