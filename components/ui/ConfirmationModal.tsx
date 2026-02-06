'use client';

import { Button } from './Button';
import { Icon } from './Icon';
import { ModalBackdrop, ModalContent } from './ModalBackdrop';

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
  const variantStyles = {
    danger: {
      icon: 'alert-triangle',
      iconColor: 'text-red-500',
      buttonVariant: 'danger' as const,
      bg: 'bg-red-50 dark:bg-red-900/10',
    },
    warning: {
      icon: 'alert-circle',
      iconColor: 'text-amber-500',
      buttonVariant: 'secondary' as const,
      bg: 'bg-amber-50 dark:bg-amber-900/10',
    },
    info: {
      icon: 'info',
      iconColor: 'text-blue-500',
      buttonVariant: 'primary' as const,
      bg: 'bg-blue-50 dark:bg-blue-900/10',
    },
  };

  const currentVariant = variantStyles[variant];

  // Map variant to Button variant roughly
  const confirmButtonVariant =
    variant === 'danger'
      ? 'outline' // Using outline for danger usually, or custom class for red
      : variant === 'info'
        ? 'primary'
        : 'secondary';

  const confirmButtonClass =
    variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white border-transparent' : '';

  return (
    <ModalBackdrop isOpen={isOpen} onClick={isLoading ? undefined : onClose} zIndex="200">
      <ModalContent maxWidth="md" onClick={e => e.stopPropagation()}>
        <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl overflow-hidden border border-surface-200 dark:border-surface-700">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full shrink-0 ${currentVariant.bg}`}>
                <Icon
                  name={currentVariant.icon as any}
                  size={24}
                  className={currentVariant.iconColor}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100 mb-2">
                  {title}
                </h3>
                <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                {cancelText}
              </Button>
              <Button
                variant={confirmButtonVariant}
                onClick={onConfirm}
                loading={isLoading}
                className={confirmButtonClass}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </ModalContent>
    </ModalBackdrop>
  );
}
