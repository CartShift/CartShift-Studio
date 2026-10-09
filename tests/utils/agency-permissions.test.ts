import { describe, expect, it } from 'vitest';
import { canAccessNav, PERMISSIONS } from '@/lib/utils/permissions';

describe('Agency operations permissions', () => {
  it('restricts financial reporting to commercial roles', () => {
    for (const role of ['owner', 'admin', 'sales_manager'] as const) {
      expect(canAccessNav(role, PERMISSIONS.VIEW_SALES_DASHBOARD)).toBe(true);
    }
    for (const role of ['developer', 'member', 'viewer'] as const) {
      expect(canAccessNav(role, PERMISSIONS.VIEW_SALES_DASHBOARD)).toBe(false);
    }
  });

  it('does not grant client or proposal management permissions to developers', () => {
    expect(canAccessNav('developer', PERMISSIONS.MANAGE_CLIENTS)).toBe(false);
    expect(canAccessNav('developer', PERMISSIONS.MANAGE_PRICING)).toBe(false);
    expect(canAccessNav('owner', PERMISSIONS.MANAGE_PRICING)).toBe(true);
  });
});
