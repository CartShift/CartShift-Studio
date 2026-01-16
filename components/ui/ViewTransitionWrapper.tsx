'use client';

import { type ReactNode } from 'react';
import { useViewTransition, type TransitionPreset } from '@/lib/hooks/useViewTransition';

export interface ViewTransitionWrapperProps {
  children: ReactNode;
  preset?: TransitionPreset;
  duration?: number;
  easing?: string;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export const ViewTransitionWrapper = ({
  children,
  preset = 'default',
  className,
  as: Component = 'div',
  ...options
}: ViewTransitionWrapperProps) => {
  const { startViewTransition } = useViewTransition();

  const applyTransition = async (callback: () => void) => {
    await startViewTransition(callback, {
      preset,
      ...options,
    });
  };

  return (
    <Component className={className} data-view-transition-preset={preset}>
      {children}
    </Component>
  );
};
