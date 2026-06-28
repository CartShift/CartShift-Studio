'use client';

import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

const tableHeadVariants = cva('px-6 py-4 text-start', {
  variants: {
    cellAlign: {
      start: 'text-start',
      end: 'text-end',
      center: 'text-center',
    },
    headStyle: {
      default: 'font-black uppercase tracking-widest text-xs text-surface-400',
      label: 'portal-label-sm',
    },
  },
  defaultVariants: {
    cellAlign: 'start',
    headStyle: 'default',
  },
});

const tableCellVariants = cva('px-6 py-4 text-sm text-surface-700 dark:text-surface-300', {
  variants: {
    cellAlign: {
      start: 'text-start',
      end: 'text-end',
      center: 'text-center',
    },
  },
  defaultVariants: {
    cellAlign: 'start',
  },
});

interface PortalTableProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function PortalTable({ children, className, ...props }: PortalTableProps) {
  return (
    <div className={cn('portal-card overflow-hidden shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function PortalTableScroll({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-x-auto', className)} {...props}>
      {children}
    </div>
  );
}

export function PortalTableElement({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full text-start text-sm', className)} {...props}>
      {children}
    </table>
  );
}

export function PortalTableHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-surface-50 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-800',
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export function PortalTableBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-surface-100 dark:divide-surface-800', className)} {...props}>
      {children}
    </tbody>
  );
}

const tableRowVariants = cva('group transition-colors', {
  variants: {
    hover: {
      true: 'hover:bg-surface-50/50 dark:hover:bg-surface-800/30',
      false: '',
    },
  },
  defaultVariants: { hover: false },
});

interface PortalTableRowProps
  extends HTMLAttributes<HTMLTableRowElement>, VariantProps<typeof tableRowVariants> {}

export const PortalTableRow = forwardRef<HTMLTableRowElement, PortalTableRowProps>(
  ({ children, className, hover, ...props }, ref) => (
    <tr ref={ref} className={cn(tableRowVariants({ hover }), className)} {...props}>
      {children}
    </tr>
  )
);
PortalTableRow.displayName = 'PortalTableRow';

interface PortalTableHeadProps
  extends ThHTMLAttributes<HTMLTableCellElement>, VariantProps<typeof tableHeadVariants> {}

export function PortalTableHead({
  cellAlign,
  headStyle,
  className,
  ...props
}: PortalTableHeadProps) {
  return <th className={cn(tableHeadVariants({ cellAlign, headStyle }), className)} {...props} />;
}

interface PortalTableCellProps
  extends TdHTMLAttributes<HTMLTableCellElement>, VariantProps<typeof tableCellVariants> {}

export function PortalTableCell({ cellAlign, className, ...props }: PortalTableCellProps) {
  return <td className={cn(tableCellVariants({ cellAlign }), className)} {...props} />;
}

export { tableCellVariants, tableHeadVariants };
