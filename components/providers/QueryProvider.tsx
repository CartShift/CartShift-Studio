'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getAuthInstance } from '@/lib/services/auth';
import { getAppQueryClient } from '@/lib/query/query-client-config';

interface QueryProviderProps {
  children: ReactNode;
}

/** Clear tenant-scoped query data whenever Firebase changes the authenticated identity. */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getAppQueryClient();
  const previousUid = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), user => {
      const nextUid = user?.uid ?? null;
      if (previousUid.current !== undefined && previousUid.current !== nextUid) {
        queryClient.clear();
      }
      previousUid.current = nextUid;
    });
    return unsubscribe;
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
