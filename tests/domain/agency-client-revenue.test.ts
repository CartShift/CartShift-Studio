import { describe, expect, it } from 'vitest';
import { mergeAgencyClientRevenue } from '@/lib/domain/agency-client-revenue';

describe('agency client revenue projection', () => {
  it('joins records by organization ID and sorts by revenue descending', () => {
    const clients = [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }];
    const result = mergeAgencyClientRevenue(clients, [
      { orgId: 'b', totalRevenue: 900, pendingRevenue: 100, paidCount: 2 },
      { orgId: 'a', totalRevenue: 1200, pendingRevenue: 0, paidCount: 3 },
    ]);
    expect(result.map(row => row.id)).toEqual(['a', 'b', 'c']);
    expect(result[2]).toMatchObject({ totalRevenue: 0, pendingRevenue: 0, paidCount: 0 });
    expect(clients.map(row => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('preserves the first duplicate revenue row and stable sorting on ties', () => {
    const result = mergeAgencyClientRevenue([{ id: 'one' }, { id: 'two' }], [
      { orgId: 'one', totalRevenue: 10, pendingRevenue: 2, paidCount: 1 },
      { orgId: 'one', totalRevenue: 800, pendingRevenue: 2, paidCount: 2 },
      { orgId: 'two', totalRevenue: 10, pendingRevenue: 1, paidCount: 1 },
    ]);
    expect(result.map(item => item.id)).toEqual(['one', 'two']);
    expect(result[0].totalRevenue).toBe(10);
  });
});
