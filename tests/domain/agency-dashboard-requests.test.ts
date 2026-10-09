import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import { summarizeAgencyRequests, type AgencySummaryRequest } from '@/lib/domain/agency-dashboard-requests';

describe('agency dashboard request projection', () => {
  it('prioritizes urgent and recently updated items while excluding bundle children', () => {
    const requests: AgencySummaryRequest[] = [
      { status: 'NEW', priority: 'NORMAL', updatedAt: Timestamp.fromMillis(500) },
      { status: 'NEW', priority: 'URGENT', updatedAt: Timestamp.fromMillis(100) },
      { status: 'NEW', priority: 'URGENT', updatedAt: Timestamp.fromMillis(900) },
      { status: 'NEW', priority: 'URGENT', requestRole: 'bundle_item' },
    ];
    const result = summarizeAgencyRequests(requests);
    expect(result.attention).toEqual([requests[2], requests[1], requests[0]]);
    expect(requests[0]).toBeDefined(); // source list is not mutated
    expect(requests[0].priority).toBe('NORMAL');
  });

  it('preserves existing proposal and waiting filters', () => {
    const result = summarizeAgencyRequests([
      { status: 'QUOTED', priority: 'NORMAL', isBillable: true },
      { status: 'QUOTED', priority: 'NORMAL', requestRole: 'bundle_item', isBillable: true },
      { status: 'DRAFT', priority: 'HIGH', isBillable: true },
      { status: 'CANCELED', priority: 'LOW', isBillable: true },
      { status: 'ACCEPTED', priority: 'NORMAL', publicToken: 'token' },
      { status: 'QUOTED', priority: 'NORMAL' },
    ] satisfies AgencySummaryRequest[]);
    expect(result.waiting).toBe(2);
    expect(result.openProposals).toHaveLength(4);
    expect(result.attention).toHaveLength(0);
  });
});
