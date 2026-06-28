'use client';

import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import { ReactNode } from 'react';

interface PortalQueryHydrationProps {
  state?: DehydratedState;
  children: ReactNode;
}

export function PortalQueryHydration({ state, children }: PortalQueryHydrationProps) {
  if (!state) {
    return children;
  }

  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
