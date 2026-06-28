'use client';

import type { ReactNode } from 'react';
import { Direction, Tooltip } from 'radix-ui';

interface RadixProviderProps {
  children: ReactNode;
  dir: 'ltr' | 'rtl';
}

/** Supplies locale direction and shared tooltip timing to every Radix primitive. */
export function RadixProvider({ children, dir }: RadixProviderProps) {
  return (
    <Direction.Provider dir={dir}>
      <Tooltip.Provider delayDuration={200} skipDelayDuration={300}>
        {children}
      </Tooltip.Provider>
    </Direction.Provider>
  );
}
