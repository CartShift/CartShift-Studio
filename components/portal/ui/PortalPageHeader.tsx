import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const portalPageHeaderVariants = cva(
  'flex flex-col justify-between gap-4 md:flex-row md:items-end',
  {
    variants: {
      density: {
        default: 'mb-6',
        compact: 'mb-4',
      },
    },
    defaultVariants: {
      density: 'default',
    },
  }
);

interface PortalPageHeaderProps extends VariantProps<typeof portalPageHeaderVariants> {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export function PortalPageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
  density,
  className,
}: PortalPageHeaderProps) {
  return (
    <header className={cn(portalPageHeaderVariants({ density }), className)}>
      <div className="min-w-0">
        {(eyebrow || Icon) && (
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-primary-600 dark:text-primary-400">
            {Icon && (
              <span className="flex size-7 items-center justify-center rounded-lg border border-primary-200/70 bg-primary-50/80 dark:border-primary-400/15 dark:bg-primary-500/10">
                <Icon className="size-3.5" aria-hidden />
              </span>
            )}
            {eyebrow && <span>{eyebrow}</span>}
          </div>
        )}
        <h1 className="portal-page-title">{title}</h1>
        {description && <p className="portal-page-subtitle">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{action}</div>}
    </header>
  );
}

export { portalPageHeaderVariants };
