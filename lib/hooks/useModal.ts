'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';

/**
 * useModal - Shared modal state management hook
 *
 * Provides common modal functionality:
 * - State management (isOpen, mounted)
 * - Keyboard navigation (ESC to close)
 * - Body scroll prevention
 * - Cleanup on unmount
 */
export interface UseModalOptions {
  /** Initial open state */
  initialOpen?: boolean;
  /** Whether to prevent body scroll when open (default: true) */
  preventScroll?: boolean;
  /** Callback when modal is opened */
  onOpen?: () => void;
  /** Callback when modal is closed */
  onClose?: () => void;
  /** Translation key for accessibility labels */
  accessibilityLabel?: {
    close?: string;
    dismiss?: string;
  };
}

export const useModal = ({
  initialOpen = false,
  preventScroll = true,
  onOpen,
  onClose,
  accessibilityLabel,
}: UseModalOptions = {}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [mounted, setMounted] = useState(false);

  const t = useTranslations();

  // Handle component mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return;

    if (typeof document === 'undefined' || !document.body) {
      return;
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // Prevent scroll on mobile
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = '';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = '';
    };
  }, [isOpen, preventScroll]);

  // Handle ESC key to close modal
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    },
    [isOpen]
  );

  // Register keyboard listener
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Open modal
  const open = useCallback(() => {
    setIsOpen(true);
    onOpen?.();
  }, [onOpen]);

  // Close modal
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  // Toggle modal
  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (prev) {
        onClose?.();
      } else {
        onOpen?.();
      }
      return !prev;
    });
  }, [onOpen, onClose]);

  return {
    isOpen,
    mounted,
    open,
    close,
    toggle,
    // Accessibility labels
    closeLabel: accessibilityLabel?.close || t('common.close' as any) || 'Close',
    dismissLabel: accessibilityLabel?.dismiss || t('common.dismiss' as any) || 'Dismiss',
    // Check if we're in browser environment
    isBrowser: typeof document !== 'undefined' && typeof document.body !== 'undefined',
    // Document body check
    documentBody: typeof document !== 'undefined' ? document.body : null,
  };
};
