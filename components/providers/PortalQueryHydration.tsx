'use client';

import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { rehydrateDehydratedState } from '@/lib/query/rehydrate-dehydrated-state';

interface PortalQueryHydrationProps {
  state?: DehydratedState;
  children: ReactNode;
}

export function PortalQueryHydration({ state, children }: PortalQueryHydrationProps) {
  if (!state) {
    return children;
  }

  return <HydrationBoundary state={rehydrateDehydratedState(state)}>{children}</HydrationBoundary>;
}
