import { describe, expect, it } from 'vitest';
import { matchesAgencyRequestView } from '@/lib/utils/request-views';
import type { Request } from '@/lib/types/portal';

const make = (status: Request['status'], extra: Partial<Request> = {}) => ({
  status, tags: [], ...extra,
} as Request);

describe('agency request views', () => {
  it('surfaces only actionable statuses in the attention view', () => {
    expect(matchesAgencyRequestView(make('NEW'), 'attention')).toBe(true);
    expect(matchesAgencyRequestView(make('CHANGES_REQUESTED'), 'attention')).toBe(true);
    expect(matchesAgencyRequestView(make('QUOTED'), 'attention')).toBe(false);
  });
  it('keeps a separate waiting and completed view', () => {
    expect(matchesAgencyRequestView(make('QUOTED'), 'waiting')).toBe(true);
    expect(matchesAgencyRequestView(make('PAID'), 'done')).toBe(true);
    expect(matchesAgencyRequestView(make('IN_PROGRESS'), 'done')).toBe(false);
  });
  it('finds commercial requests regardless of their canonical status', () => {
    expect(matchesAgencyRequestView(make('DRAFT', { isBillable: true }), 'proposals')).toBe(true);
    expect(matchesAgencyRequestView(make('PAID', { tags: ['quote'] }), 'proposals')).toBe(true);
    expect(matchesAgencyRequestView(make('NEW'), 'proposals')).toBe(false);
  });
  it('still supports exact status filtering', () => {
    expect(matchesAgencyRequestView(make('QUEUED'), 'QUEUED')).toBe(true);
    expect(matchesAgencyRequestView(make('NEW'), 'QUEUED')).toBe(false);
    expect(matchesAgencyRequestView(make('NEW'), 'All')).toBe(true);
  });
});
