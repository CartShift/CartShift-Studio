import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

const inputVariants = cva(
  [
    'w-full rounded-xl border transition-all duration-200',
    'bg-white dark:bg-surface-900/80',
    'text-surface-900 dark:text-white',
    'placeholder:text-surface-400 dark:placeholder:text-surface-500',
    'focus:outline-none',
    'h-10 text-sm font-medium',
    'shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]',
    'dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)]',
  ],
  {
    variants: {
      state: {
        default: [
          'border-surface-200/80 dark:border-white/[0.08]',
          'hover:border-surface-300 dark:hover:border-white/[0.12]',
          'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
          'dark:focus:ring-primary-400/20 dark:focus:border-primary-400',
        ],
        error: [
          'border-rose-300 dark:border-rose-500/30',
          'focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20',
          'bg-rose-50/50 dark:bg-rose-500/5',
        ],
        success: [
          'border-emerald-300 dark:border-emerald-500/30',
          'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
          'bg-emerald-50/50 dark:bg-emerald-500/5',
        ],
      },
      inputSize: {
        sm: 'h-8 text-xs px-3',
        md: 'h-10 text-sm px-4',
        lg: 'h-12 text-base px-4',
      },
      isDisabled: {
        true: [
          'disabled:bg-surface-100 dark:disabled:bg-surface-800/50',
          'disabled:text-surface-400 disabled:cursor-not-allowed',
          'disabled:border-surface-200 dark:disabled:border-surface-700',
        ],
        false: '',
      },
      hasLeftIcon: {
        true: 'ps-10',
        false: '',
      },
      hasRightIcon: {
        true: 'pe-10',
        false: '',
      },
    },
    defaultVariants: {
      state: 'default',
      inputSize: 'md',
      isDisabled: false,
      hasLeftIcon: false,
      hasRightIcon: false,
    },
  }
);

interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Omit<VariantProps<typeof inputVariants>, 'isDisabled' | 'hasLeftIcon' | 'hasRightIcon'> {
  label?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, success, className, leftIcon, rightIcon, hint, disabled, id, ...props },
    ref
  ) => {
    const state = error ? 'error' : success ? 'success' : 'default';
    const hasRightContent = Boolean(rightIcon || error || success);

    // Generate unique IDs for aria-describedby
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-surface-700 dark:text-surface-300 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none transition-colors group-focus-within:text-primary-500">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              inputVariants({
                state,
                isDisabled: !!disabled,
                hasLeftIcon: !!leftIcon,
                hasRightIcon: hasRightContent,
              }),
              className
            )}
            {...props}
          />

          <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            {rightIcon}
            {error && (
              <AlertCircle
                size={18}
                className="text-red-500 animate-in fade-in zoom-in duration-200"
              />
            )}
            {success && !error && (
              <Check
                size={18}
                className="text-emerald-500 animate-in fade-in zoom-in duration-200"
              />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="text-xs text-error font-medium animate-in slide-in-from-top-1 duration-200 flex items-center gap-1.5"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint Text (if no error) */}
        {!error && hint && (
          <p id={hintId} className="text-xs text-surface-500 dark:text-surface-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { inputVariants };
