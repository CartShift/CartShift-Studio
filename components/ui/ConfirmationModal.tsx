'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from '@/lib/motion';
import { Button } from './Button';
import { Icon } from './Icon';

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

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      buttonVariant: 'secondary' as const, // or warning if available
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
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white border-transparent'
      : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
            onClick={isLoading ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, y: 20, x: '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 z-[201] w-full max-w-md p-4"
            style={{ x: '-50%', y: '-50%' }} // Ensure explicit transform override/merge
            onClick={(e) => e.stopPropagation()}
          >
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
