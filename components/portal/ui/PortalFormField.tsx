'use client';

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PortalFormFieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }>;
}

export function PortalFormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: PortalFormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? fieldId,
        'aria-invalid': error ? true : children.props['aria-invalid'],
        'aria-describedby': describedBy ?? children.props['aria-describedby'],
      })
    : children;

  return (
    <div className={cn('w-full space-y-1.5 group', className)}>
      <label
        htmlFor={fieldId}
        className="text-[13px] font-bold text-surface-700 dark:text-surface-300 group-focus-within:text-primary-600 dark:group-focus-within:text-primary-400 transition-colors"
      >
        {label}
        {required ? (
          <span className="text-rose-500 ms-0.5" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {control}

      {error ? (
        <p
          id={errorId}
          className="text-xs text-error font-medium animate-in slide-in-from-top-1 duration-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!error && hint ? (
        <p id={hintId} className="text-xs text-surface-500 dark:text-surface-400">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface PortalFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PortalFormSection({ title, description, children, className }: PortalFormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="font-outfit text-lg font-bold text-surface-900 dark:text-white">{title}</h3>
        {description ? <p className="text-sm text-surface-500 mt-0.5">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

interface PortalFormGridProps {
  children: ReactNode;
  className?: string;
}

export function PortalFormGrid({ children, className }: PortalFormGridProps) {
  return <div className={cn('grid gap-4 md:grid-cols-2', className)}>{children}</div>;
}
