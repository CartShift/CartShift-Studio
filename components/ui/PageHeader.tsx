import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const headerVariants = cva(
  "mb-6",
  {
    variants: {
      align: {
        default: "",
        center: "text-center flex flex-col items-center",
      },
      compact: {
        true: "mb-3",
        false: "",
      },
    },
    defaultVariants: {
      align: "default",
      compact: false,
    },
  }
);

interface PageHeaderProps
  extends VariantProps<typeof headerVariants> {
  title: string;
  description?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  description,
  subtitle,
  badge,
  action,
  align,
  compact,
  className,
}: PageHeaderProps) => (
  <div className={cn(headerVariants({ align, compact }), className)}>
    <div className={cn(
      "flex items-center justify-between gap-3",
      align === 'center' && "w-full"
    )}>
      <div className={cn(
        "flex items-center gap-2",
        align === 'center' && "justify-center w-full"
      )}>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{title}</h1>
        {badge}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
    {(description || subtitle) && (
      <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 max-w-2xl">
        {description || subtitle}
      </p>
    )}
  </div>
);

export { headerVariants };
