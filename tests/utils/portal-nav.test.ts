import { describe, it, expect } from 'vitest';
import {
  normalizePortalPath,
  isPortalNavActive,
  shouldShowPortalBreadcrumbs,
} from '@/lib/utils/portal-nav';
import { getPortalPath } from '@/lib/utils/portal-paths';

describe('portal-nav utils', () => {
  it('normalizes trailing slashes', () => {
    expect(normalizePortalPath('/portal/dashboard/')).toBe('/portal/dashboard');
    expect(normalizePortalPath('/portal')).toBe('/portal');
  });

  it('matches dashboard root exactly', () => {
    const dashboard = getPortalPath('/dashboard');
    expect(isPortalNavActive(dashboard, dashboard)).toBe(true);
    expect(isPortalNavActive(`${dashboard}/reports`, dashboard)).toBe(false);
  });

  it('matches nested routes with prefix', () => {
    const requests = getPortalPath('/requests');
    expect(isPortalNavActive(`${requests}/abc`, requests)).toBe(true);
    expect(isPortalNavActive(getPortalPath('/settings'), requests)).toBe(false);
  });

  it('hides breadcrumbs on main nav pages', () => {
    const dashboard = getPortalPath('/dashboard');
    const paths = [dashboard];
    expect(shouldShowPortalBreadcrumbs(dashboard, paths)).toBe(false);
    expect(shouldShowPortalBreadcrumbs(`${dashboard}/reports`, paths)).toBe(true);
  });
});
