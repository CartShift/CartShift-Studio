/** A candidate only. Historical previews must be manually reviewed. */
export function previewMayContainInternalComment(
  preview: unknown,
  internalContent: unknown,
): boolean {
  if (typeof preview !== 'string' || !preview || typeof internalContent !== 'string' || !internalContent) {
    return false;
  }
  const truncated = internalContent.length > 100
    ? internalContent.substring(0, 100) + '...'
    : internalContent;
  return preview === truncated;
}
