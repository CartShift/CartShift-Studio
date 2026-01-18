'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * useFocusTrap - A hook that traps focus within a container element
 *
 * This hook is essential for modal accessibility (WCAG 2.1 AA).
 * When enabled, it:
 * - Captures focus when the modal opens
 * - Prevents focus from leaving the modal via Tab/Shift+Tab
 * - Returns focus to the trigger element when the modal closes
 *
 * @param isActive - Whether the focus trap is currently active
 * @param options - Configuration options
 * @returns ref to attach to the container element
 *
 * @example
 * ```tsx
 * const modalRef = useFocusTrap(isOpen);
 * return <div ref={modalRef}>...</div>;
 * ```
 */

interface FocusTrapOptions {
  /** Whether to auto-focus the first focusable element when trap activates */
  autoFocus?: boolean;
  /** Whether to restore focus to the previously focused element when trap deactivates */
  restoreFocus?: boolean;
  /** Initial element to focus (CSS selector) */
  initialFocus?: string;
}

const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  options: FocusTrapOptions = {}
) {
  const { autoFocus = true, restoreFocus = true, initialFocus } = options;

  const containerRef = useRef<T>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter(el => el.offsetParent !== null); // Filter out hidden elements
  }, []);

  // Handle Tab key to trap focus
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab from first element -> go to last
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab from last element -> go to first
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }

      // If focus is somehow outside the container, bring it back
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [getFocusableElements]
  );

  useEffect(() => {
    if (!isActive) return;

    // Store the currently focused element to restore later
    if (restoreFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    // Auto-focus the first focusable element (or specified initial element)
    if (autoFocus && containerRef.current) {
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        let elementToFocus: HTMLElement | null = null;

        if (initialFocus) {
          elementToFocus = containerRef.current.querySelector(initialFocus);
        }

        if (!elementToFocus) {
          const focusableElements = getFocusableElements();
          elementToFocus = focusableElements[0] || containerRef.current;
        }

        elementToFocus?.focus();
      });
    }

    // Add keydown listener
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus when trap is deactivated
      if (restoreFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isActive, autoFocus, restoreFocus, initialFocus, handleKeyDown, getFocusableElements]);

  return containerRef;
}

export default useFocusTrap;
