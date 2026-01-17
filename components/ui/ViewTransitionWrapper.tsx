'use client';

import React, { type ReactNode } from 'react';
import { type TransitionPreset } from '@/lib/hooks/useViewTransition';

export interface ViewTransitionWrapperProps {
  children: ReactNode;
  preset?: TransitionPreset;
  duration?: number;
  easing?: string;
  className?: string;
  as?: React.ElementType;
}

export const ViewTransitionWrapper = ({
  children,
  preset = 'default',
  className,
  as: Component = 'div',
}: ViewTransitionWrapperProps) => {
  return (
    <Component className={className} data-view-transition-preset={preset}>
      {children}
    </Component>
  );
};
