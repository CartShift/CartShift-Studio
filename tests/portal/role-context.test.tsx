import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  user: {
    userData: null as null | Record<string, unknown>,
    loading: false, isAuthenticated: true,
    accountType: 'CLIENT', isImpersonating: false,
    impersonatedAccountId: null as string | null,
  },
  org: {
    orgId: 'org-a' as string | null,
    loading: false, hasMultipleOrgs: true,
    fullOrganizations: [{ id: 'org-a', name: 'First' }],
    switchOrg: vi.fn(),
  },
  router: { push: vi.fn() },
  getMember: vi.fn(),
}));

vi.mock('@/lib/hooks/usePortalAuth', () => ({
  usePortalAuth: () => mocks.user,
}));
vi.mock('@/lib/context/OrgContext', () => ({
  useOrg: () => mocks.org,
}));
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => mocks.router,
}));
vi.mock('@/lib/services/portal-organizations', () => ({
  getMemberByUserId: mocks.getMember,
}));
vi.mock('@/lib/services/auth', () => ({
  isLoggingOut: () => false,
}));
vi.mock('@/lib/logger', () => ({ Logger: { error: vi.fn() } }));

import { usePortalAuthState } from '@/components/portal/shell/hooks/usePortalAuthState';

describe('portal role stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.org.orgId = 'org-a';
    mocks.user.userData = {
      id: 'client-1', isAgency: false, accountType: 'CLIENT',
    };
    mocks.user.accountType = 'CLIENT';
    mocks.user.isImpersonating = false;
    mocks.user.impersonatedAccountId = null;
    mocks.getMember.mockImplementation(async orgId => ({
      role: orgId === 'org-a' ? 'owner' : 'member',
    }));
  });

  it('never derives an agency role from an agency URL', async () => {
    const { result } = renderHook(() => usePortalAuthState({ isAgencyPage: true }));
    await waitFor(() => expect(result.current.isAuthorized).toBe(false));
    expect(result.current.isAgency).toBe(false);
    expect(result.current.memberRole).toBeUndefined();
    expect(mocks.getMember).not.toHaveBeenCalled();
  });

  it('clears a previous workspace role while the next membership is checked', async () => {
    const { result, rerender } = renderHook(() => usePortalAuthState({}));
    await waitFor(() => expect(result.current.memberRole).toBe('owner'));
    mocks.org.orgId = 'org-b';
    rerender();
    expect(result.current.memberRole).toBeUndefined();
    await waitFor(() => expect(result.current.memberRole).toBe('member'));
  });

  it('never substitutes a client organization name for the signed-in user', async () => {
    mocks.user.userData = {
      id: 'agency-1', name: 'Signed-in user', accountType: 'CLIENT',
      isAgency: false,
    };
    mocks.user.isImpersonating = true;
    mocks.user.impersonatedAccountId = 'org-a';
    const { result } = renderHook(() => usePortalAuthState({}));
    await waitFor(() => expect(result.current.isAuthorized).toBe(true));
    expect(result.current.displayUserData?.name).toBe('Signed-in user');
    expect(result.current.isAgency).toBe(false);
  });
});
