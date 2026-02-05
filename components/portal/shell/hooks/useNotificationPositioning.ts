'use client';

import { useState, useEffect, useCallback, type RefObject } from 'react';
import type { NotificationPosition } from '../types';

interface UseNotificationPositioningOptions {
  buttonRef: RefObject<HTMLButtonElement | null>;
  dropdownRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  dropdownWidth?: number;
  dropdownHeight?: number;
  gap?: number;
  padding?: number;
}

interface UseNotificationPositioningResult {
  position: NotificationPosition;
}

/**
 * Hook for calculating notification dropdown positioning.
 * Handles RTL/LTR layouts and viewport edge cases.
 */
export function useNotificationPositioning({
  buttonRef,
  dropdownRef,
  isOpen,
  dropdownWidth = 384,
  dropdownHeight = 450,
  gap = 8,
  padding = 16,
}: UseNotificationPositioningOptions): UseNotificationPositioningResult {
  const [position, setPosition] = useState<NotificationPosition>({
    top: 0,
    right: 0,
    left: 0,
  });

  const updatePosition = useCallback(() => {
    if (!buttonRef.current || !dropdownRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = buttonRect.bottom + gap;
    let right: number | undefined;
    let left: number | undefined;

    // Horizontal positioning
    const isRightHalf = buttonRect.left + buttonRect.width / 2 > viewportWidth / 2;

    if (isRightHalf) {
      // Align right edge of dropdown with right edge of button
      right = viewportWidth - buttonRect.right;
      left = undefined;
    } else {
      // Align left edge of dropdown with left edge of button
      left = buttonRect.left;
      right = undefined;
    }

    // Ensure horizontal safety (keep within padding)
    if (right !== undefined && right < padding) {
      right = padding;
    }
    if (left !== undefined && left < padding) {
      left = padding;
    }

    // Vertical positioning - ensure dropdown fits in viewport
    if (top + dropdownHeight > viewportHeight - padding) {
      top = Math.max(padding, buttonRect.top - dropdownHeight - gap);
    }
    if (top < padding) {
      top = padding;
    }

    setPosition({ top, right, left });
  }, [buttonRef, dropdownRef, dropdownWidth, dropdownHeight, gap, padding]);

  // Position update effect
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    const rafId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  return { position };
}
