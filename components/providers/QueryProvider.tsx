'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { getAppQueryClient } from '@/lib/query/query-client-config';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getAppQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
