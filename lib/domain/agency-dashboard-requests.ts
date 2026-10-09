import type { Request } from '@/lib/types/portal';

export type AgencySummaryRequest = Pick<Request, 'status' | 'priority'> &
  Partial<Pick<Request, 'requestRole' | 'updatedAt' | 'isBillable' | 'publicToken'>>;

const ATTENTION_STATUSES = new Set(['NEW', 'NEEDS_INFO', 'CHANGES_REQUESTED', 'IN_REVIEW']);
const WAITING_STATUSES = new Set(['QUOTED']);
const OPEN_PROPOSAL_STATUSES = new Set(['DRAFT', 'QUOTED', 'CHANGES_REQUESTED', 'ACCEPTED']);
const PRIORITY_WEIGHT: Record<string, number> = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

function priorityScore(request: AgencySummaryRequest): number {
  return (ATTENTION_STATUSES.has(request.status) ? 20 : 0) +
    (PRIORITY_WEIGHT[request.priority] || 0);
}

/**
 * Pure agency dashboard projection.
 * Keeps business rules and sorting separate from the rendering component.
 */
export function summarizeAgencyRequests<T extends AgencySummaryRequest>(
  requests: readonly T[],
): { attention: T[]; waiting: number; openProposals: T[] } {
  const attention: T[] = [];
  const openProposals: T[] = [];
  let waiting = 0;

  for (const request of requests) {
    if (request.requestRole !== 'bundle_item') {
      if (ATTENTION_STATUSES.has(request.status)) attention.push(request);
      if (WAITING_STATUSES.has(request.status)) waiting++;
    }

    // Proposals are canonical portal requests, never a separate collection.
    if (
      Boolean(request.isBillable || request.publicToken || request.requestRole === 'bundle') &&
      OPEN_PROPOSAL_STATUSES.has(request.status)
    ) {
      openProposals.push(request);
    }
  }

  attention.sort((a, b) =>
    priorityScore(b) - priorityScore(a) ||
    (b.updatedAt?.toMillis?.() || 0) - (a.updatedAt?.toMillis?.() || 0)
  );
  return { attention, waiting, openProposals };
}
