import { CLIENT_STATUS_MAP, type Request, type Organization } from '@/lib/types/portal';
import { matchesAgencyRequestView } from '@/lib/utils/request-views';

export type RequestListFilterOptions = {
  isAgency: boolean;
  orgFilter: string;
  activeFilter: string;
  searchQuery: string;
  pinnedIds: readonly string[];
  orgNames: Readonly<Record<string, Pick<Organization, 'name'> | undefined>>;
};

/** Search, filters and pin order preserved from the request list UX. */
export function filterAndSortRequests<T extends Request>(
  requests: readonly T[],
  options: RequestListFilterOptions,
): T[] {
  const { isAgency, orgFilter, activeFilter, orgNames } = options;
  const search = options.searchQuery.trim().toLowerCase();
  const ids = new Set(requests.map(request => request.id));
  const pinned = new Set(options.pinnedIds);

  return requests.filter(req => {
    if (req.requestRole === 'bundle_item' && req.parentRequestId && ids.has(req.parentRequestId)) {
      return false;
    }
    if (isAgency && orgFilter !== 'all' && req.orgId !== orgFilter) return false;

    if (activeFilter !== 'All') {
      const matches = isAgency
        ? matchesAgencyRequestView(req, activeFilter)
        : CLIENT_STATUS_MAP[req.status] === activeFilter;
      if (!matches) return false;
    }

    return !search ||
      (req.title?.toLowerCase() || '').includes(search) ||
      (req.id?.toLowerCase() || '').includes(search) ||
      (req.description?.toLowerCase() || '').includes(search) ||
      (req.type?.toLowerCase() || '').includes(search) ||
      (req.createdByName?.toLowerCase() || '').includes(search) ||
      (isAgency && Boolean(orgNames[req.orgId]?.name?.toLowerCase().includes(search)));
  }).sort((a, b) => {
    const aPinned = pinned.has(a.id);
    const bPinned = pinned.has(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return 0;
  });
}
