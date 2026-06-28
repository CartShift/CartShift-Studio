'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Logical start/end automatically follow the active locale direction. */
  side?: 'top' | 'bottom' | 'start' | 'end';
  className?: string;
  /** Delay in seconds, retained for backwards compatibility. */
  delay?: number;
  id?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
  delay = 0.2,
  id,
}: TooltipProps) {
  const isRtl = useLocale() === 'he';
  const physicalSide =
    side === 'start' ? (isRtl ? 'right' : 'left') : side === 'end' ? (isRtl ? 'left' : 'right') : side;

  return (
    <TooltipPrimitive.Root delayDuration={delay * 1000}>
      <TooltipPrimitive.Trigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          id={id}
          side={physicalSide}
          sideOffset={8}
          collisionPadding={12}
          className={cn(
            'z-tooltip rounded-md bg-surface-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg',
            'dark:bg-surface-800',
            'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            'motion-reduce:animate-none',
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-surface-900 dark:fill-surface-800" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
