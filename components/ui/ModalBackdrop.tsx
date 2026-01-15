'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from '@/lib/motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * ModalBackdrop - A reusable modal backdrop component
 *
 * This component standardizes modal behavior across the app:
 * - Uses createPortal to render at document.body level (covers entire viewport)
 * - Prevents body scroll when open
 * - Consistent z-index and backdrop blur
 * - Supports different visual variants
 * - Smooth animations with Framer Motion
 * - Click-to-close behavior
 */

export const modalBackdropVariants = cva(
  'fixed inset-0 backdrop-blur-sm transition-colors duration-300',
  {
    variants: {
      variant: {
        default: 'bg-black/50',
        light: 'bg-surface-950/40',
        dark: 'bg-surface-950/80',
        surface: 'bg-surface-900/60',
      },
      blur: {
        none: '',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      blur: 'sm',
    },
  }
);

export interface ModalBackdropProps extends VariantProps<typeof modalBackdropVariants> {
  /** Whether the backdrop is visible */
  isOpen: boolean;
  /** Callback when backdrop is clicked */
  onClick?: () => void;
  /** Optional z-index value (defaults to modal z-index) */
  zIndex?: string | number;
  /** Whether to prevent body scrolling when open (default: true) */
  preventScroll?: boolean;
  /** Custom className for additional styling */
  className?: string;
  /** Children to render alongside the backdrop */
  children?: React.ReactNode;
}

export const ModalBackdrop = ({
  isOpen,
  onClick,
  zIndex = '50', // z-modal from tailwind config
  preventScroll = true,
  className,
  children,
  variant,
  blur,
}: ModalBackdropProps) => {
  // Check if we're in browser environment
  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return;

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

  // Render to document.body to ensure backdrop covers entire viewport
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(modalBackdropVariants({ variant, blur }), className)}
            style={{ zIndex }}
            onClick={onClick}
            aria-hidden="true"
          />

          {/* Children (typically the modal content) */}
          {children && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
              }}
              style={{
                zIndex:
                  typeof zIndex === 'number'
                    ? zIndex + 1
                    : typeof zIndex === 'string' && !isNaN(Number(zIndex))
                      ? Number(zIndex) + 1
                      : `calc(${zIndex} + 1)`,
                position: 'relative', // Ensure proper stacking context
              }}
            >
              {children}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

/**
 * ModalContent - A container for modal content with consistent styling
 */
export interface ModalContentProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  position?: 'center' | 'top';
  onClick?: (e: React.MouseEvent) => void;
}

export const modalContentVariants = cva(
  'bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-800 overflow-hidden',
  {
    variants: {
      maxWidth: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        full: 'max-w-full',
      },
      position: {
        center: 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4',
        top: 'fixed top-0 inset-x-0 p-4',
      },
    },
    defaultVariants: {
      maxWidth: 'lg',
      position: 'center',
    },
  }
);

export const ModalContent = ({
  children,
  className,
  maxWidth = 'lg',
  position = 'center',
  onClick,
}: ModalContentProps) => {
  return (
    <div
      className={cn(modalContentVariants({ maxWidth, position }), className)}
      onClick={onClick}
      style={{
        // Ensure modal content is always above backdrop
        // Using a high z-index relative to typical modal backdrops (z-200)
        // This ensures content is always visible above the backdrop blur
        zIndex: 201, // Above typical backdrop z-index of 200
      }}
    >
      {children}
    </div>
  );
};

/**
 * ModalHeader - Consistent modal header with optional close button
 */
export interface ModalHeaderProps {
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export const ModalHeader = ({ title, description, onClose, className }: ModalHeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-start justify-between p-6 border-b border-surface-200 dark:border-surface-800',
        className
      )}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-xl font-bold text-surface-900 dark:text-white font-outfit">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 font-medium font-outfit">
            {description}
          </p>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-surface-500"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * ModalBody - Container for modal body content
 */
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const ModalBody = ({ children, className, scrollable }: ModalBodyProps) => {
  const baseClasses = 'p-6';
  const scrollableClasses = scrollable ? 'overflow-y-auto max-h-[70vh]' : '';

  return <div className={cn(baseClasses, scrollableClasses, className)}>{children}</div>;
};

/**
 * ModalFooter - Consistent footer with action buttons
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export const ModalFooter = ({ children, className, align = 'end' }: ModalFooterProps) => {
  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-6 border-t border-surface-200 dark:border-surface-800',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};
