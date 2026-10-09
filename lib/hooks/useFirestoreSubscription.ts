'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Bridges Firestore onSnapshot listeners with TanStack Query cache.
 * Subscription identity is based on key value, not a new array on every render.
 */
export function useFirestoreSubscription<T>(
  queryKey: readonly unknown[],
  subscribe: ((callback: (data: T) => void) => () => void) | null,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const keyRef = useRef(queryKey);
  const subscribeRef = useRef(subscribe);
  const serializedKey = JSON.stringify(queryKey);
  keyRef.current = queryKey;
  subscribeRef.current = subscribe;

  useEffect(() => {
    const startSubscription = subscribeRef.current;
    if (!enabled || !startSubscription) return;

    const unsubscribe = startSubscription((data: T) => {
      queryClient.setQueryData(keyRef.current, data);
    });

    return () => unsubscribe();
  }, [serializedKey, enabled, queryClient]);
}
