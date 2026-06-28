'use client';

import { AlertDialog } from 'radix-ui';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    Icon: AlertTriangle,
    iconColor: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-900/10',
    button: 'border-transparent bg-red-600 text-white hover:bg-red-700',
  },
  warning: {
    Icon: AlertCircle,
    iconColor: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-900/10',
    button: '',
  },
  info: {
    Icon: Info,
    iconColor: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    button: '',
  },
} as const;

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  const current = variantStyles[variant];
  const { Icon } = current;

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={open => !open && !isLoading && onClose()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 motion-reduce:animate-none" />
        <AlertDialog.Content className="fixed start-1/2 top-1/2 z-[201] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-2xl outline-none rtl:translate-x-1/2 dark:border-surface-700 dark:bg-surface-800 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 motion-reduce:animate-none">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn('shrink-0 rounded-full p-3', current.bg)}>
                <Icon size={24} className={current.iconColor} aria-hidden="true" />
              </div>
              <div className="flex-1">
                <AlertDialog.Title className="mb-2 text-lg font-semibold text-surface-900 dark:text-surface-100">
                  {title}
                </AlertDialog.Title>
                <AlertDialog.Description className="text-sm leading-relaxed text-surface-600 dark:text-surface-400">
                  {description}
                </AlertDialog.Description>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <AlertDialog.Cancel asChild>
                <Button
                  variant="ghost"
                  disabled={isLoading}
                  className="hover:bg-surface-100 dark:hover:bg-surface-700"
                >
                  {cancelText}
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant={variant === 'info' ? 'primary' : variant === 'warning' ? 'secondary' : 'outline'}
                  onClick={event => {
                    event.preventDefault();
                    onConfirm();
                  }}
                  loading={isLoading}
                  className={current.button}
                >
                  {confirmText}
                </Button>
              </AlertDialog.Action>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
