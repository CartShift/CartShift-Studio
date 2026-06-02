'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  /** Position of tooltip. 'start'/'end' are RTL-aware alternatives to 'left'/'right' */
  side?: 'top' | 'bottom' | 'start' | 'end';
  className?: string;
  delay?: number;
  /** Optional ID for accessibility linking */
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
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const tooltipId = id || `tooltip-${Math.random().toString(36).substring(2, 9)}`;

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay * 1000);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  // Use logical properties for RTL support (start = left in LTR, right in RTL)
  const positionClasses = {
    top: 'bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mb-2',
    bottom: 'top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 mt-2',
    start: 'end-full top-1/2 -translate-y-1/2 me-2',
    end: 'start-full top-1/2 -translate-y-1/2 ms-2',
  };

  const arrowClasses = {
    top: 'top-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-t-surface-900 dark:border-t-surface-800 border-s-transparent border-e-transparent border-b-transparent',
    bottom:
      'bottom-full start-1/2 -translate-x-1/2 rtl:translate-x-1/2 border-b-surface-900 dark:border-b-surface-800 border-s-transparent border-e-transparent border-t-transparent',
    start:
      'end-full top-1/2 -translate-y-1/2 border-s-surface-900 dark:border-s-surface-800 border-t-transparent border-b-transparent border-e-transparent',
    end: 'start-full top-1/2 -translate-y-1/2 border-e-surface-900 dark:border-e-surface-800 border-t-transparent border-b-transparent border-s-transparent',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      aria-describedby={isVisible ? tooltipId : undefined}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-tooltip px-2.5 py-1.5 text-xs font-medium text-white bg-surface-900 rounded-md shadow-lg pointer-events-none whitespace-nowrap dark:bg-surface-800',
              positionClasses[side],
              className
            )}
            role="tooltip"
            id={tooltipId}
            aria-hidden={!isVisible}
          >
            {content}
            <div className={cn('absolute w-0 h-0 border-4', arrowClasses[side])} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
