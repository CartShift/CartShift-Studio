import type { Request } from '@/lib/types/portal';

export type SearchRequestShape = Pick<
  Request,
  'isBillable' | 'publicToken' | 'requestRole'
>;

export function isCommercialRequest(request: SearchRequestShape): boolean {
  return Boolean(
    request.isBillable || request.publicToken || request.requestRole === 'bundle'
  );
}

/** Search compares normalized text; authorization is enforced separately. */
export function matchesPortalQuery(term: string, ...values: (string | null | undefined)[]): boolean {
  const normalized = term.trim().toLocaleLowerCase();
  return normalized.length > 0 && values.some(
    value => (value || '').toLocaleLowerCase().includes(normalized)
  );
}

/**
 * UI-level scope guard. Server-side tenant and role authorization must remain
 * authoritative; this filter never grants access to additional records.
 */
export function requestSearchPool<T extends SearchRequestShape>(
  requests: readonly T[],
  options: {
    isAgency: boolean;
    canViewCommercial: boolean;
    kind: 'regular' | 'commercial' | 'all';
  }
): T[] {
  const { isAgency, canViewCommercial, kind } = options;
  return requests.filter(request => {
    const commercial = isCommercialRequest(request);
    if (isAgency && commercial && !canViewCommercial) return false;
    if (kind === 'regular') return !isAgency || !commercial;
    if (kind === 'commercial') return isAgency && canViewCommercial && commercial;
    return true;
  });
}
