import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { QueryProvider } from '@/components/providers/QueryProvider';

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  getQueryClient: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('firebase/auth', () => ({ onAuthStateChanged: mocks.subscribe }));
vi.mock('@/lib/services/auth', () => ({ getAuthInstance: mocks.getAuth }));
vi.mock('@/lib/query/query-client-config', () => ({
  getAppQueryClient: mocks.getQueryClient,
}));

describe('QueryProvider Firebase identity boundaries', () => {
  let queryClient: QueryClient;
  const unsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient();
    mocks.getQueryClient.mockReturnValue(queryClient);
    mocks.getAuth.mockReturnValue({});
    mocks.subscribe.mockReturnValue(unsubscribe);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('discards stale cached tenant data when the initial identity resolves', () => {
    queryClient.setQueryData(['portal', 'org-A', 'private'], { secret: 'old account' });
    const { unmount } = render(<QueryProvider><div>Portal</div></QueryProvider>);
    const listener = mocks.subscribe.mock.calls[0]?.[1] as (user: { uid: string } | null) => void;
    expect(listener).toBeTypeOf('function');

    act(() => listener({ uid: 'user-B' }));
    expect(queryClient.getQueryData(['portal', 'org-A', 'private'])).toBeUndefined();
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('preserves cache for same identity and clears it on switch or logout', () => {
    const { unmount } = render(<QueryProvider><div>Portal</div></QueryProvider>);
    const listener = mocks.subscribe.mock.calls[0]?.[1] as (user: { uid: string } | null) => void;
    act(() => listener({ uid: 'user-A' }));
    queryClient.setQueryData(['portal', 'data'], 'account-A');
    act(() => listener({ uid: 'user-A' }));
    expect(queryClient.getQueryData(['portal', 'data'])).toBe('account-A');

    act(() => listener({ uid: 'user-B' }));
    expect(queryClient.getQueryData(['portal', 'data'])).toBeUndefined();
    queryClient.setQueryData(['portal', 'data'], 'account-B');
    act(() => listener(null));
    expect(queryClient.getQueryData(['portal', 'data'])).toBeUndefined();
    unmount();
  });
});
