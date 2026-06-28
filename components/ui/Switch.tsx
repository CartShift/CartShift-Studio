'use client';

import { useId } from 'react';
import { cva } from 'class-variance-authority';
import { Switch as SwitchPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

const switchTrackVariants = cva(
  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-surface-950',
  {
    variants: {
      checked: {
        true: 'bg-primary-600',
        false: 'bg-surface-200 dark:bg-surface-800',
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      checked: false,
      disabled: false,
    },
  }
);

const switchThumbVariants = cva(
  'pointer-events-none block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out will-change-transform',
  {
    variants: {
      checked: {
        true: 'translate-x-5 rtl:-translate-x-5',
        false: 'translate-x-0',
      },
    },
    defaultVariants: {
      checked: false,
    },
  }
);

interface SwitchProps {
  /** The switch label text */
  label?: string;
  /** Description text shown below the label */
  description?: string;
  /** Current checked state */
  checked: boolean;
  /** Callback when state changes */
  onChange: (checked: boolean) => void;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Unique ID for the switch (auto-generated if not provided) */
  id?: string;
  /** aria-label for screen readers when no visible label is provided */
  'aria-label'?: string;
}

export const Switch = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className,
  id,
  'aria-label': ariaLabel,
}: SwitchProps) => {
  const generatedId = useId();
  const switchId = id || `switch-${generatedId}`;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div className={cn('flex items-start justify-between gap-4 py-2', className)}>
      <div className="flex-1">
        {label && (
          <label
            htmlFor={switchId}
            className="text-sm font-bold text-surface-900 dark:text-white block mb-0.5 cursor-pointer"
          >
            {label}
          </label>
        )}
        {description && (
          <p
            id={descriptionId}
            className="text-xs text-surface-500 dark:text-surface-400 font-medium"
          >
            {description}
          </p>
        )}
      </div>
      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={ariaLabel}
        aria-describedby={descriptionId}
        className={cn(switchTrackVariants({ checked, disabled }))}
        disabled={disabled}
      >
        <SwitchPrimitive.Thumb className={cn(switchThumbVariants({ checked }))} />
      </SwitchPrimitive.Root>
    </div>
  );
};

export { switchTrackVariants, switchThumbVariants };
