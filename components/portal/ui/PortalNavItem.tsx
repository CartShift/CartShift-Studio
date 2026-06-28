'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const portalNavItemVariants = cva(
  'portal-focus-ring w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl transition-colors font-outfit',
  {
    variants: {
      active: {
        true: 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm',
        false:
          'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800',
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

interface PortalNavItemProps extends VariantProps<typeof portalNavItemVariants> {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  className?: string;
  'aria-current'?: 'page' | undefined;
}

export function PortalNavItem({
  label,
  icon: Icon,
  active,
  onClick,
  className,
  'aria-current': ariaCurrent,
}: PortalNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={ariaCurrent}
      className={cn(portalNavItemVariants({ active }), className)}
    >
      {Icon ? <Icon size={18} aria-hidden /> : null}
      {label}
    </button>
  );
}

export { portalNavItemVariants };
