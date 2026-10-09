import { describe, expect, it } from 'vitest';
import { activeItem, moveActiveIndex } from '@/lib/utils/list-navigation';

describe('portal result navigation', () => {
  it('wraps forwards and backwards', () => {
    expect(moveActiveIndex(2, 3, 1)).toBe(0);
    expect(moveActiveIndex(0, 3, -1)).toBe(2);
  });

  it('never computes NaN or an invalid index for empty lists', () => {
    expect(moveActiveIndex(0, 0, 1)).toBe(0);
    expect(moveActiveIndex(0, 0, -1)).toBe(0);
    expect(moveActiveIndex(Number.NaN, 0, 1)).toBe(0);
    expect(activeItem([], 0)).toBeUndefined();
  });

  it('bounds stale indices after query results shrink', () => {
    expect(moveActiveIndex(8, 2, 1)).toBe(1);
    expect(activeItem(['first'], 8)).toBeUndefined();
    expect(activeItem(['first'], 0)).toBe('first');
  });
});
