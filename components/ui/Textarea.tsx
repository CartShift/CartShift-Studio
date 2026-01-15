import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, Check } from 'lucide-react';
import { inputVariants } from './Input';

interface TextareaProps
  extends
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<VariantProps<typeof inputVariants>, 'isDisabled' | 'hasLeftIcon' | 'hasRightIcon'> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, success, hint, disabled, state: propState, ...props }, ref) => {
    // Determine state based on props if not explicitly provided
    const state = propState || (error ? 'error' : success ? 'success' : 'default');

    return (
      <div className="w-full space-y-1.5 group">
        {label && (
          <label className="text-sm font-bold text-surface-700 dark:text-surface-300 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors">
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            className={cn(
              'flex min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm ring-offset-background placeholder:text-surface-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
              // Base styles matching Input
              'bg-white dark:bg-surface-900/80',
              'text-surface-900 dark:text-white',
              'placeholder:text-surface-400 dark:placeholder:text-surface-500',
              'focus:outline-none',
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
            disabled={disabled}
            {...props}
          />

          {/* Icons positioned at top-right for Textarea */}
          <div className="absolute end-3 top-3 pointer-events-none flex gap-2">
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
          <p className="text-xs text-red-600 dark:text-red-400 font-medium animate-in slide-in-from-top-1 duration-200 flex items-center gap-1.5">
            {error}
          </p>
        )}

        {/* Hint Text */}
        {!error && hint && <p className="text-xs text-surface-500 dark:text-surface-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
