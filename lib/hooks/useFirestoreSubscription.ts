'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Bridges Firestore onSnapshot listeners with TanStack Query cache.
 * Sets up a real-time subscription that automatically updates the query cache.
 *
 * @param queryKey - The TanStack Query key to update
 * @param subscribe - A function that takes a callback and returns an unsubscribe function
 * @param enabled - Whether the subscription should be active
 */
export function useFirestoreSubscription<T>(
  queryKey: readonly unknown[],
  subscribe: ((callback: (data: T) => void) => () => void) | null,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const unsubRef = useRef<(() => void) | null>(null);
  const keyRef = useRef(JSON.stringify(queryKey));

  useEffect(() => {
    const currentKey = JSON.stringify(queryKey);

    if (!enabled || !subscribe) {
      unsubRef.current?.();
      unsubRef.current = null;
      return;
    }

    // Only resubscribe if the key actually changed
    if (unsubRef.current && keyRef.current === currentKey) return;

    unsubRef.current?.();
    keyRef.current = currentKey;

    unsubRef.current = subscribe((data: T) => {
      queryClient.setQueryData(queryKey, data);
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [JSON.stringify(queryKey), enabled, subscribe]);
}
