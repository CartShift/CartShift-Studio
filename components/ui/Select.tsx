'use client';

import React, { useId } from 'react';
import { type VariantProps } from 'class-variance-authority';
import { Select as SelectPrimitive } from 'radix-ui';
import { AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { inputVariants } from './Input';

const EMPTY_VALUE = '__cartshift_empty_value__';

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SelectProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'children' | 'defaultValue' | 'onChange' | 'value'
    >,
    Omit<VariantProps<typeof inputVariants>, 'isDisabled' | 'hasLeftIcon' | 'hasRightIcon'> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  options?: SelectOption[];
  /** Native option children are normalized during the migration period. */
  children?: React.ReactNode;
  placeholder?: string;
  value?: string | number;
  defaultValue?: string | number;
  /** Explicit label for the selected value when the trigger cannot resolve item text. */
  valueLabel?: React.ReactNode;
  onValueChange?: (value: string) => void;
  /** @deprecated Prefer onValueChange. Retained while controlled consumers migrate. */
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  name?: string;
  required?: boolean;
}

function normalizeValue(value: string | number | undefined) {
  if (value === undefined) return undefined;
  return String(value) === '' ? EMPTY_VALUE : String(value);
}

const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      success,
      hint,
      disabled,
      state: propState,
      options = [],
      children,
      placeholder,
      value,
      defaultValue,
      valueLabel,
      onValueChange,
      onChange,
      name,
      required,
      id,
      onBlur,
      'aria-label': ariaLabel,
      ...triggerProps
    },
    ref
  ) => {
    const state = propState || (error ? 'error' : success ? 'success' : 'default');
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const errorId = `${selectId}-error`;
    const hintId = `${selectId}-hint`;
    const describedBy = error ? errorId : hint ? hintId : undefined;
    const normalizedOptions: SelectOption[] =
      options.length > 0
        ? options
        : React.Children.toArray(children).flatMap(child => {
            if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child)) {
              return [];
            }
            return [
              {
                value: String(child.props.value ?? ''),
                label: child.props.children,
                disabled: child.props.disabled,
              },
            ];
          });

    const emitValue = (nextValue: string) => {
      const denormalizedValue = nextValue === EMPTY_VALUE ? '' : nextValue;
      onValueChange?.(denormalizedValue);

      if (onChange) {
        onChange({ target: { value: denormalizedValue, name } } as React.ChangeEvent<HTMLSelectElement>);
      }
    };

    return (
      <div className="group w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-[13px] font-bold text-surface-700 transition-colors group-focus-within:text-primary-600 dark:text-surface-300 dark:group-focus-within:text-primary-400"
          >
            {label}
          </label>
        )}

        <SelectPrimitive.Root
          value={normalizeValue(value)}
          defaultValue={normalizeValue(defaultValue)}
          onValueChange={emitValue}
          disabled={disabled}
          name={name}
          required={required}
        >
          <SelectPrimitive.Trigger
            {...triggerProps}
            ref={ref}
            id={selectId}
            name={name}
            onBlur={onBlur}
            aria-label={ariaLabel || label}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-start text-[13px] font-medium text-surface-900 shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-200',
              'focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-surface-900/80 dark:text-white dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.02)]',
              state === 'default' &&
                'border-surface-200/80 hover:border-surface-300 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:border-white/[0.08] dark:hover:border-white/[0.12] dark:focus:border-primary-400 dark:focus:ring-primary-400/20',
              state === 'error' &&
                'border-rose-300 bg-rose-50/50 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-rose-500/30 dark:bg-rose-500/5',
              state === 'success' &&
                'border-emerald-300 bg-emerald-50/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-emerald-500/30 dark:bg-emerald-500/5',
              className
            )}
          >
            <SelectPrimitive.Value placeholder={placeholder}>
              {valueLabel}
            </SelectPrimitive.Value>
            <SelectPrimitive.Icon asChild>
              {error ? (
                <AlertCircle size={18} className="shrink-0 text-red-500" />
              ) : (
                <ChevronDown size={16} className="shrink-0 text-surface-400" />
              )}
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              position="popper"
              sideOffset={6}
              collisionPadding={12}
              className={cn(
                'z-tooltip max-h-[min(20rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-surface-200/80 bg-white/95 p-1.5 text-surface-900 shadow-xl backdrop-blur-xl',
                'dark:border-white/10 dark:bg-surface-900/95 dark:text-white',
                'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 motion-reduce:animate-none'
              )}
            >
              <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-surface-500">
                <ChevronUp size={14} />
              </SelectPrimitive.ScrollUpButton>
              <SelectPrimitive.Viewport>
                {normalizedOptions.map(option => {
                  const optionValue = normalizeValue(option.value) ?? EMPTY_VALUE;
                  return (
                    <SelectPrimitive.Item
                      key={optionValue}
                      value={optionValue}
                      disabled={option.disabled}
                      className="relative flex min-h-9 cursor-default select-none items-center rounded-lg py-2 ps-8 pe-3 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45 data-[highlighted]:bg-primary-600 data-[highlighted]:text-white"
                    >
                      <span className="absolute start-2.5 inline-flex items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <Check size={14} />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                  );
                })}
              </SelectPrimitive.Viewport>
              <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-surface-500">
                <ChevronDown size={14} />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {error && (
          <p id={errorId} className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
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
