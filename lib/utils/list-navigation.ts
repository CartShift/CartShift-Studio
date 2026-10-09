/** Pure cyclic keyboard navigation shared by portal result lists.
 * A zero-result list must never produce NaN or choose a non-existent item.
 */
export function moveActiveIndex(current: number, length: number, direction: -1 | 1): number {
  if (!Number.isInteger(length) || length <= 0) return 0;
  const safeCurrent = Number.isInteger(current) && current >= 0 && current < length ? current : 0;
  return (safeCurrent + direction + length) % length;
}

export function activeItem<T>(items: readonly T[], index: number): T | undefined {
  return Number.isInteger(index) && index >= 0 ? items[index] : undefined;
}
