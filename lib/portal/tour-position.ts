/** Pure viewport positioning for the highlighted onboarding step. */
export function positionTourCard(
  target: Pick<DOMRect, 'top' | 'bottom' | 'left'>,
  viewportWidth: number,
  viewportHeight: number
): { top: number; left: number } {
  const gutter = 16;
  const gap = 16;
  const width = Math.max(0, Math.min(448, viewportWidth - gutter * 2));
  const estimatedHeight = Math.max(0, Math.min(420, viewportHeight - gutter * 2));
  const maxTop = Math.max(gutter, viewportHeight - estimatedHeight - gutter);
  const maxLeft = Math.max(gutter, viewportWidth - width - gutter);
  const below = target.bottom + gap;
  const above = target.top - estimatedHeight - gap;
  const preferred = below + estimatedHeight + gutter <= viewportHeight
    ? below
    : above >= gutter
      ? above
      : below;

  return {
    top: Math.max(gutter, Math.min(preferred, maxTop)),
    left: Math.max(gutter, Math.min(target.left, maxLeft)),
  };
}
