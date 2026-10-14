import { describe, expect, it } from 'vitest';
import { canAccessRequestBilling, type RequestBillingAccess } from '@/lib/domain/request-billing-access';

const base: RequestBillingAccess = {
  uid: 'alice',
  isAgency: false,
  hasOrgMembership: false,
  revokedMembership: false,
  request: { createdBy: 'owner', clientUserId: null, clientEmail: 'alice@example.com' },
};

describe('billing request authorization', () => {
  it('rejects unverified email ownership, even if an editable profile email matches', () => {
    expect(canAccessRequestBilling(base)).toBe(false);
    expect(canAccessRequestBilling({ ...base, verifiedEmail: null })).toBe(false);
  });

  it('allows a verified Firebase email claim to match an old email-only request', () => {
    expect(canAccessRequestBilling({ ...base, verifiedEmail: ' Alice@Example.com ' })).toBe(true);
    expect(canAccessRequestBilling({ ...base, verifiedEmail: 'mallory@example.com' })).toBe(false);
  });

  it('allows linked users and active organization members', () => {
    expect(canAccessRequestBilling({ ...base, request: { ...base.request, clientUserId: 'alice' } })).toBe(true);
    expect(canAccessRequestBilling({ ...base, hasOrgMembership: true })).toBe(true);
  });

  it('rejects revoked members even if they created or own the request', () => {
    expect(canAccessRequestBilling({
      ...base,
      hasOrgMembership: true,
      revokedMembership: true,
      request: { ...base.request, createdBy: 'alice', clientUserId: 'alice' },
      verifiedEmail: 'alice@example.com',
    })).toBe(false);
  });

  it('allows authorized agency users after the server has established agency membership', () => {
    expect(canAccessRequestBilling({ ...base, isAgency: true })).toBe(true);
  });
});
