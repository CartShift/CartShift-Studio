import { describe, expect, it } from 'vitest';
import { canPrefetchPortalRequest } from '@/lib/domain/prefetch-authorization';

const base = { uid: 'client-a', email: 'client-a@example.com', isAgency: false, organizations: ['org-a'] };
const request = { orgId: 'org-b', createdBy: 'client-b', clientUserId: 'client-b', clientEmail: 'client-b@example.com' };

describe('Admin SDK request prefetch authorization', () => {
  it('does not prefetch another tenant request', () => {
    expect(canPrefetchPortalRequest(base, request, false)).toBe(false);
  });

  it('allows active members and legitimate pre-assigned client email', () => {
    expect(canPrefetchPortalRequest(base, { ...request, orgId: 'org-a' }, false)).toBe(true);
    expect(canPrefetchPortalRequest(base, { ...request, clientEmail: 'CLIENT-A@example.com' }, false)).toBe(true);
  });

  it('denies revoked users even when they created the request', () => {
    expect(canPrefetchPortalRequest(base, { ...request, createdBy: 'client-a' }, true)).toBe(false);
  });

  it('allows agency access through the verified staff profile', () => {
    expect(canPrefetchPortalRequest({ ...base, isAgency: true }, request, false)).toBe(true);
  });
});
