'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Bridges Firestore onSnapshot listeners with TanStack Query cache.
 */
export function useFirestoreSubscription<T>(
  queryKey: readonly unknown[],
  subscribe: ((callback: (data: T) => void) => () => void) | null,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const unsubRef = useRef<(() => void) | null>(null);
  const keyRef = useRef(JSON.stringify(queryKey));
  const subscribeRef = useRef(subscribe);
  subscribeRef.current = subscribe;

  const serializedKey = JSON.stringify(queryKey);

  useEffect(() => {
    if (!enabled || !subscribeRef.current) {
      unsubRef.current?.();
      unsubRef.current = null;
      return;
    }

    if (unsubRef.current && keyRef.current === serializedKey) return;

    unsubRef.current?.();
    keyRef.current = serializedKey;

    unsubRef.current = subscribeRef.current((data: T) => {
      queryClient.setQueryData(queryKey, data);
    });

    return () => {
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, [serializedKey, enabled, queryClient, queryKey]);
}
