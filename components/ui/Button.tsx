'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Check, X, Loader2 } from 'lucide-react';

/**
 * Button Component Variants
 *
 * @accessibility Touch Target Compliance (WCAG 2.1 AA):
 * - xs (h-7, 28px): ⚠️ Below 44px minimum - use only for non-critical, secondary actions
 * - sm (h-9, 36px): ⚠️ Below 44px minimum - use only for compact layouts with low error cost
 * - md (h-10, 40px): Compact desktop default for dense portal screens
 * - lg (h-12, 48px): ✅ Meets minimum touch target requirement for primary actions
 * - icon (h-10, 40px): ⚠️ Slightly below minimum - consider icon-lg for critical actions
 * - icon-sm (h-8, 32px): ⚠️ Below minimum - use only for toolbar-style compact UIs
 * - icon-lg (h-12, 48px): ✅ Meets minimum touch target requirement
 */
export const buttonVariants = cva(
  [
    // Layout
    'relative inline-flex items-center justify-center gap-2 overflow-hidden',
    // Typography
    'font-outfit font-semibold',
    // Shape
    'rounded-xl',
    // Transitions - only target what changes for better performance
    'transition-[transform,box-shadow,background-color,border-color,color] duration-200',
    // Focus states (accessibility)
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-surface-950',
    // Disabled states
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Touch optimization
    'touch-manipulation active:scale-[0.97]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white border border-primary-500/80',
          'shadow-btn-primary',
          'hover:bg-primary-500',
          'hover:shadow-btn-primary-hover',
          'active:shadow-btn-primary-active',
        ],
        secondary: [
          'bg-surface-100 dark:bg-white/[0.08] text-surface-700 dark:text-white',
          'border border-surface-200/80 dark:border-white/[0.08]',
          'shadow-btn-secondary',
          'hover:bg-surface-200/80 dark:hover:bg-white/[0.12]',
          'hover:border-surface-300 dark:hover:border-white/[0.12]',
          'hover:shadow-btn-secondary-hover',
        ],
        outline: [
          'bg-transparent text-surface-700 dark:text-surface-200',
          'border-2 border-surface-200 dark:border-white/[0.12]',
          'hover:bg-surface-50 dark:hover:bg-white/[0.04]',
          'hover:border-surface-300 dark:hover:border-white/[0.18]',
        ],
        ghost: [
          'bg-transparent text-surface-600 dark:text-surface-300',
          'hover:bg-surface-100/80 dark:hover:bg-white/[0.06]',
          'hover:text-surface-900 dark:hover:text-white',
        ],
        danger: [
          'bg-gradient-to-b from-rose-500 to-rose-600 text-white',
          'shadow-btn-danger',
          'hover:from-rose-400 hover:to-rose-600',
          'hover:shadow-btn-danger-hover',
        ],
        success: [
          'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white',
          'shadow-btn-success',
          'hover:from-emerald-400 hover:to-emerald-600',
          'hover:shadow-btn-success-hover',
        ],
        gradient: [
          'bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-[length:200%_100%] text-white',
          'shadow-btn-gradient',
          'hover:bg-[position:100%_0] hover:shadow-btn-gradient-hover',
          'transition-[background-position,box-shadow,transform] duration-500',
        ],
        glass: [
          'bg-white/10 dark:bg-white/[0.06] backdrop-blur-md text-surface-900 dark:text-white',
          'border border-white/30 dark:border-white/[0.1]',
          'shadow-btn-glass',
          'hover:bg-white/20 dark:hover:bg-white/[0.1]',
          'hover:shadow-btn-glass-hover',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs gap-1',
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-8 w-8 p-0',
        'icon-lg': 'h-11 w-11 p-0',
      },
      btnState: {
        idle: '',
        loading: 'cursor-wait opacity-90',
        success:
          'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-none shadow-none',
        error: 'bg-gradient-to-b from-rose-500 to-rose-600 text-white border-none shadow-none',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      btnState: 'idle',
    },
  }
);

export interface ButtonProps
  extends
    Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'
    >,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  as?: 'button' | 'div' | 'span' | 'a';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      btnState,
      className,
      children,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      as = 'button',
      ...props
    },
    ref
  ) => {
    const currentState = loading ? 'loading' : btnState || 'idle';

    const isDisabled =
      disabled ||
      currentState === 'loading' ||
      currentState === 'success' ||
      currentState === 'error';

    const Component = (motion[as as keyof typeof motion] as any) || motion.button;

    return (
      <Component
        ref={ref}
        {...props}
        whileHover={!isDisabled && currentState === 'idle' ? { y: -1 } : undefined}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        className={cn(
          buttonVariants({
            variant,
            size,
            btnState: currentState as any,
            className,
          })
        )}
        disabled={isDisabled}
      >
        <span className="relative z-dropdown flex items-center justify-center gap-2">
          <AnimatePresence>
            {currentState === 'loading' && (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
              </motion.span>
            )}
            {currentState === 'success' && (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Check className="h-5 w-5" strokeWidth={3} />
              </motion.span>
            )}
            {currentState === 'error' && (
              <motion.span
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>

          <span
            className={cn(
              'flex items-center gap-2 transition-opacity duration-200',
              currentState !== 'idle' ? 'opacity-0 invisible' : 'opacity-100'
            )}
          >
            {leftIcon}
            {children}
            {rightIcon}
          </span>
        </span>
      </Component>
    );
  }
);

Button.displayName = 'Button';
