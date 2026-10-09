import { describe, expect, it } from 'vitest';
import { paginateRows } from '@/lib/utils/table-pagination';

describe('portal table pagination', () => {
  const rows = ['one', 'two', 'three', 'four', 'five'];

  it('paginates one-based indexes without skipping results', () => {
    expect(paginateRows(rows, 1, 2).items).toEqual(['one', 'two']);
    expect(paginateRows(rows, 3, 2).items).toEqual(['five']);
  });

  it('never renders an empty stale page after deletions or filters', () => {
    expect(paginateRows(rows.slice(0, 2), 4, 2)).toMatchObject({
      items: ['one', 'two'],
      page: 1,
      totalPages: 1,
    });
  });

  it('handles zero results and invalid paging inputs', () => {
    expect(paginateRows([], 5, 8)).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
    });
    expect(paginateRows(rows, Number.NaN, 0).page).toBe(1);
  });
});
