import { getPortalPath } from '@/lib/utils/portal-paths';
import { normalizePortalPath } from '@/lib/utils/portal-nav';

export const AGENCY_PRIMARY_NAV_HREFS = [
  getPortalPath('/agency/workboard/'),
  getPortalPath('/agency/clients/'),
  getPortalPath('/requests/'),
  getPortalPath('/agency/sales/'),
].map(normalizePortalPath);

export function isAgencyPrimaryNavHref(href: string): boolean {
  const normalized = normalizePortalPath(href);
  return AGENCY_PRIMARY_NAV_HREFS.some(
    primary => normalized === primary || normalized.startsWith(`${primary}/`)
  );
}
