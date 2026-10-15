import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFirestoreSubscription } from '@/lib/hooks/useFirestoreSubscription';

describe('useFirestoreSubscription', () => {
  it('does not resubscribe on equivalent query key arrays, but cleans up on scope change', () => {
    const queryClient = new QueryClient();
    const stops: Array<ReturnType<typeof vi.fn>> = [];
    const subscribe = vi.fn((_callback: (data: string[]) => void) => {
      const stop = vi.fn();
      stops.push(stop);
      return stop;
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { rerender, unmount } = renderHook(
      ({ scope }) => useFirestoreSubscription(['requests', scope], subscribe),
      { initialProps: { scope: 'org-a' }, wrapper }
    );

    expect(subscribe).toHaveBeenCalledTimes(1);
    rerender({ scope: 'org-a' });
    expect(subscribe).toHaveBeenCalledTimes(1);

    rerender({ scope: 'org-b' });
    expect(stops[0]).toHaveBeenCalledTimes(1);
    expect(subscribe).toHaveBeenCalledTimes(2);

    unmount();
    expect(stops[1]).toHaveBeenCalledTimes(1);
  });

  it('never writes a late callback from an old organization into the new organization cache', () => {
    const queryClient = new QueryClient();
    const listeners: Array<(data: string[]) => void> = [];
    const subscribe = vi.fn((callback: (data: string[]) => void) => {
      listeners.push(callback);
      return vi.fn();
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { rerender, unmount } = renderHook(
      ({ scope }) => useFirestoreSubscription(['requests', scope], subscribe),
      { initialProps: { scope: 'org-a' }, wrapper }
    );

    const oldListener = listeners[0];
    expect(oldListener).toBeTypeOf('function');
    rerender({ scope: 'org-b' });
    expect(listeners).toHaveLength(2);

    act(() => {
      oldListener(['late org-a update']);
      listeners[1](['org-b update']);
    });

    expect(queryClient.getQueryData(['requests', 'org-a'])).toEqual(['late org-a update']);
    expect(queryClient.getQueryData(['requests', 'org-b'])).toEqual(['org-b update']);
    unmount();
    queryClient.clear();
  });
});
