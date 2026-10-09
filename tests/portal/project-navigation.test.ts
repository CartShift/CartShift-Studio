import { describe, expect, it } from 'vitest';
import { getAgencyNavGroups, getClientNavGroups } from '@/components/portal/shell/constants';
import { getPortalPath } from '@/lib/utils/portal-paths';

describe('Projects navigation', () => {
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
