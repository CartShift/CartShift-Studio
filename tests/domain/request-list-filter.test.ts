import { describe, expect, it } from 'vitest';
import { filterAndSortRequests, type RequestListFilterOptions } from '@/lib/domain/request-list-filter';
import type { Request } from '@/lib/types/portal';

const base: RequestListFilterOptions = {
  isAgency: true, orgFilter: 'all', activeFilter: 'All',
  searchQuery: '', pinnedIds: [], orgNames: { org1: { name: 'Arava' }, org2: { name: 'Stiletto' } },
};
const req = (id: string, extra: Partial<Request> = {}): Request => ({
  id, orgId: 'org1', title: id, status: 'NEW', priority: 'NORMAL',
  ...extra,
} as Request);

describe('request list filter', () => {
  it('does not show nested bundle items twice when their parent is loaded', () => {
    const input = [req('child', { requestRole: 'bundle_item', parentRequestId: 'parent' }), req('parent'), req('orphan', { requestRole: 'bundle_item', parentRequestId: 'missing' })];
    expect(filterAndSortRequests(input, base).map(item => item.id)).toEqual(['parent', 'orphan']);
    expect(input.map(item => item.id)).toEqual(['child', 'parent', 'orphan']);
  });

  it('prioritizes pinned items and retains stable ordering', () => {
    expect(filterAndSortRequests([req('first'), req('second'), req('third')], { ...base, pinnedIds: ['third'] }).map(item => item.id))
      .toEqual(['third', 'first', 'second']);
  });

  it('keeps organization name search and tenant filter semantics', () => {
    const input = [req('a'), req('b', { orgId: 'org2', title: 'Needles' })];
    expect(filterAndSortRequests(input, { ...base, searchQuery: 'StileTTo' }).map(item => item.id)).toEqual(['b']);
    expect(filterAndSortRequests(input, { ...base, orgFilter: 'org1' }).map(item => item.id)).toEqual(['a']);
    expect(filterAndSortRequests(input, { ...base, isAgency: false, searchQuery: 'stiletto' })).toEqual([]);
  });
});
