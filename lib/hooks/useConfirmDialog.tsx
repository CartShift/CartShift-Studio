'use client';

import { useState, useCallback } from 'react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export interface ConfirmDialogOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

type ConfirmState = ConfirmDialogOptions & { resolve: (confirmed: boolean) => void };

export function useConfirmDialog(defaults?: Partial<ConfirmDialogOptions>) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback(
    (options: ConfirmDialogOptions) =>
      new Promise<boolean>(resolve => {
        setState({ ...defaults, ...options, resolve });
      }),
    [defaults]
  );

  const close = useCallback((confirmed: boolean) => {
    setState(current => {
      current?.resolve(confirmed);
      return null;
    });
  }, []);

  const ConfirmDialog = state ? (
    <ConfirmationModal
      isOpen
      onClose={() => close(false)}
      onConfirm={() => close(true)}
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
      isLoading={state.isLoading}
    />
  ) : null;

  return { confirm, ConfirmDialog, isOpen: Boolean(state) };
}
