import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { inputVariants } from './Input';

interface SelectProps
  extends
    React.SelectHTMLAttributes<HTMLSelectElement>,
    Omit<VariantProps<typeof inputVariants>, 'isDisabled' | 'hasLeftIcon' | 'hasRightIcon'> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  options?: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      disabled,
      state: propState,
      options,
      children,
      placeholder,
      ...props
    },
    ref
  ) => {
    // Determine state based on props if not explicitly provided
    const state = propState || (error ? 'error' : success ? 'success' : 'default');

    // Generate unique IDs for accessibility
    const selectId = props.id || `select-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-bold text-surface-700 dark:text-surface-300 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            className={cn(
              'appearance-none w-full rounded-xl border transition-all duration-200',
              'bg-white dark:bg-surface-900/80',
              'text-surface-900 dark:text-white',
              'focus:outline-none',
              'h-10 text-sm font-medium px-4 pe-10', // Extra padding for arrow
              'shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)]',
              'dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)]',

              // State styles
              state === 'default' && [
                'border-surface-200/80 dark:border-white/[0.08]',
                'hover:border-surface-300 dark:hover:border-white/[0.12]',
                'focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
                'dark:focus:ring-primary-400/20 dark:focus:border-primary-400',
              ],
              state === 'error' && [
                'border-rose-300 dark:border-rose-500/30',
                'focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20',
                'bg-rose-50/50 dark:bg-rose-500/5',
              ],
              state === 'success' && [
                'border-emerald-300 dark:border-emerald-500/30',
                'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20',
                'bg-emerald-50/50 dark:bg-emerald-500/5',
              ],

              className
            )}
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected>
                {placeholder}
              </option>
            )}
            {options
              ? options.map(opt => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-surface-400">
            {error ? (
              <AlertCircle
                size={18}
                className="text-red-500 animate-in fade-in zoom-in duration-200"
              />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className="text-xs text-red-600 dark:text-red-400 font-medium animate-in slide-in-from-top-1 duration-200 flex items-center gap-1.5"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Hint Text */}
        {!error && hint && (
          <p id={hintId} className="text-xs text-surface-500 dark:text-surface-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
