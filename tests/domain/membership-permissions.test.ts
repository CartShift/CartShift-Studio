import { describe, expect, it } from 'vitest';
import { canRemoveOrganizationMember } from '@/lib/domain/membership-permissions';

describe('member removal permissions', () => {
  it('allows an active organization admin or creator', () => {
    expect(canRemoveOrganizationMember('owner', undefined, 'owner', undefined)).toBe(true);
    expect(canRemoveOrganizationMember('admin', undefined, 'owner', { role: 'admin' })).toBe(true);
  });

  it('rejects a removed creator, revoked admin and unrelated account', () => {
    expect(canRemoveOrganizationMember('owner', undefined, 'owner', { role: 'owner', removedAt: new Date() })).toBe(false);
    expect(canRemoveOrganizationMember('admin', undefined, 'owner', { role: 'admin', removedAt: new Date() })).toBe(false);
    expect(canRemoveOrganizationMember('other', { accountType: 'CLIENT' }, 'owner', undefined)).toBe(false);
  });

  it('permits agency management roles, but not developer/readonly agency roles', () => {
    expect(canRemoveOrganizationMember('staff', { accountType: 'AGENCY', agencyRole: 'admin' }, 'owner', undefined)).toBe(true);
    expect(canRemoveOrganizationMember('staff', { accountType: 'AGENCY', agencyRole: 'developer' }, 'owner', undefined)).toBe(false);
  });
});
