import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  auth: {
    user: null as { uid: string } | null,
    loading: false,
  },
}));
vi.mock('@/lib/hooks/useFirebaseAuth', () => ({
  useFirebaseAuth: () => mocks.auth,
}));

import { ImpersonationProvider, useImpersonation } from '@/lib/context/ImpersonationContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ImpersonationProvider>{children}</ImpersonationProvider>
);

describe('client view persists only for its selecting account', () => {
  beforeEach(() => {
    sessionStorage.clear();
    mocks.auth.user = null;
    mocks.auth.loading = false;
  });

  it('discards old global client-view storage', async () => {
    sessionStorage.setItem('cartshift_impersonated_account_id', 'other-client');
    mocks.auth.user = { uid: 'agency-a' };
    const { result } = renderHook(() => useImpersonation(), { wrapper });
    await waitFor(() => {
      expect(result.current.impersonatedAccountId).toBeNull();
      expect(sessionStorage.getItem('cartshift_impersonated_account_id')).toBeNull();
    });
  });

  it('restores an explicit view only for the same Firebase account', async () => {
    sessionStorage.setItem('cartshift_impersonated_account_id:agency-a', 'client-a');
    mocks.auth.user = { uid: 'agency-a' };
    const { result, rerender } = renderHook(() => useImpersonation(), { wrapper });
    await waitFor(() => expect(result.current.impersonatedAccountId).toBe('client-a'));

    mocks.auth.user = { uid: 'agency-b' };
    act(() => rerender());
    await waitFor(() => expect(result.current.impersonatedAccountId).toBeNull());

    sessionStorage.setItem('cartshift_impersonated_account_id:agency-b', 'client-b');
    mocks.auth.user = null;
    rerender();
    mocks.auth.user = { uid: 'agency-b' };
    rerender();
    await waitFor(() => expect(result.current.impersonatedAccountId).toBe('client-b'));
  });
});
