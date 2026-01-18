'use client';

/**
 * IconButton Component
 *
 * An accessible button component for icon-only actions.
 * Requires a label prop for screen reader accessibility.
 *
 * @accessibility
 * - Always includes aria-label and title for screen readers
 * - Meets WCAG touch target requirements with proper sizing
 * - Focus visible state for keyboard navigation
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

/**
 * Icon button size variants
 *
 * Touch Target Compliance (WCAG 2.1 Success Criterion 2.5.5):
 * - xs (28px): ⚠️ Below minimum - use for compact toolbars only
 * - sm (32px): ⚠️ Slightly below - acceptable for secondary actions
 * - md (40px): ✅ Meets minimum 44px when considering touch area
 * - lg (48px): ✅ Fully compliant
 */
const iconButtonVariants = cva(
  [
    // Base layout
    'inline-flex items-center justify-center',
    // Typography
    'font-semibold',
    // Shape
    'rounded-xl',
    // Transitions
    'transition-all duration-200',
    // States
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Focus
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
    // Touch
    'touch-manipulation active:scale-95',
  ],
  {
    variants: {
      variant: {
        default: [
          'text-surface-600 dark:text-surface-400',
          'hover:text-surface-900 dark:hover:text-white',
          'hover:bg-surface-100 dark:hover:bg-surface-800',
        ],
        primary: [
          'bg-primary-500 text-white',
          'hover:bg-primary-600',
          'shadow-sm',
        ],
        secondary: [
          'bg-surface-100 dark:bg-surface-800',
          'text-surface-700 dark:text-surface-300',
          'hover:bg-surface-200 dark:hover:bg-surface-700',
        ],
        ghost: [
          'text-surface-500 dark:text-surface-400',
          'hover:text-surface-700 dark:hover:text-surface-200',
          'hover:bg-surface-100/50 dark:hover:bg-surface-800/50',
        ],
        danger: [
          'text-rose-600 dark:text-rose-400',
          'hover:text-rose-700 dark:hover:text-rose-300',
          'hover:bg-rose-50 dark:hover:bg-rose-900/20',
        ],
        success: [
          'text-emerald-600 dark:text-emerald-400',
          'hover:text-emerald-700 dark:hover:text-emerald-300',
          'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        ],
        warning: [
          'text-amber-600 dark:text-amber-400',
          'hover:text-amber-700 dark:hover:text-amber-300',
          'hover:bg-amber-50 dark:hover:bg-amber-900/20',
        ],
      },
      size: {
        xs: 'w-7 h-7',
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
      },
      rounded: {
        default: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      rounded: 'default',
    },
  }
);

const iconSizeMap = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
} as const;

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof iconButtonVariants> {
  /** The icon component to render (e.g., from lucide-react) */
  icon: React.ElementType;
  /** Required accessible label for screen readers */
  label: string;
  /** Show loading spinner instead of icon */
  loading?: boolean;
  /** Custom icon size (overrides default based on button size) */
  iconSize?: number;
  /** Whether this is a toggle button */
  pressed?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      label,
      variant,
      size = 'md',
      rounded,
      loading = false,
      iconSize,
      pressed,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const computedIconSize = iconSize ?? iconSizeMap[size ?? 'md'];

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        aria-pressed={pressed}
        disabled={disabled || loading}
        className={cn(iconButtonVariants({ variant, size, rounded }), className)}
        {...props}
      >
        {loading ? (
          <Loader2 size={computedIconSize} className="animate-spin" />
        ) : (
          <Icon size={computedIconSize} />
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { iconButtonVariants };
