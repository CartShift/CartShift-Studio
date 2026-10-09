import { describe, expect, it } from 'vitest';
import { getAgencyNavGroups, getClientNavGroups } from '@/components/portal/shell/constants';
import { getPortalPath, isPortalPath } from '@/lib/utils/portal-paths';

describe('Projects navigation', () => {
  it('recognizes project pages as part of the portal', () => {
    expect(isPortalPath('/projects/')).toBe(true);
    expect(isPortalPath('/projects/project-123/')).toBe(true);
  });

  it('appears in the client workspace without an environment flag', () => {
    const items = getClientNavGroups(key => key).flatMap(group => group.items);
    expect(items).toContainEqual(
      expect.objectContaining({ href: getPortalPath('/projects/') })
    );
  });

  it('appears in the agency workspace without an environment flag', () => {
    const items = getAgencyNavGroups(key => key).flatMap(group => group.items);
    expect(items).toContainEqual(
      expect.objectContaining({ href: getPortalPath('/projects/') })
    );
  });
});
