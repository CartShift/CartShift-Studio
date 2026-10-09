/** One-based, bounded client-side pagination. Never returns an empty stale page. */
export function paginateRows<T>(rows: readonly T[], requestedPage: number, pageSize: number) {
  const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const totalPages = Math.max(1, Math.ceil(rows.length / safeSize));
  const page = Number.isInteger(requestedPage)
    ? Math.max(1, Math.min(requestedPage, totalPages))
    : 1;
  const offset = (page - 1) * safeSize;

  return {
    items: rows.slice(offset, offset + safeSize),
    page,
    totalPages,
    totalItems: rows.length,
  };
}
