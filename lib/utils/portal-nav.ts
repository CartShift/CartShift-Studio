import { getPortalPath } from '@/lib/utils/portal-paths';

export function normalizePortalPath(path: string): string {
  if (!path) return '';
  if (path.length > 1 && path.endsWith('/')) {
    return path.slice(0, -1);
  }
  return path;
}

const ROOT_NAV_PATHS = new Set([
  normalizePortalPath(getPortalPath('/dashboard')),
  normalizePortalPath(getPortalPath('/agency/workboard')),
]);

/** Whether the sidebar item should render as the active route. */
export function isPortalNavActive(pathname: string | null | undefined, href: string): boolean {
  if (!pathname) return false;

  const current = normalizePortalPath(pathname);
  const target = normalizePortalPath(href);

  if (ROOT_NAV_PATHS.has(target)) {
    return current === target;
  }

  return current === target || current.startsWith(`${target}/`);
}

export function shouldShowPortalBreadcrumbs(
  pathname: string | null | undefined,
  mainPagePaths: Iterable<string>
): boolean {
  if (!pathname) return false;
  const normalized = new Set([...mainPagePaths].map(normalizePortalPath));
  normalized.add(normalizePortalPath('/portal'));
  return !normalized.has(normalizePortalPath(pathname));
}
