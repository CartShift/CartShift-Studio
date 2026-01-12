'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { getPortalPath } from '@/lib/utils/portal-paths';
import { useLocale } from 'next-intl';
import { isRTLLocale } from '@/lib/locale-config';

const breadcrumbItemVariants = cva(
  "font-medium truncate max-w-[200px] transition-colors",
  {
    variants: {
      active: {
        true: "text-surface-900 dark:text-white",
        false: "text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200",
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  const locale = useLocale();
  const isRTL = isRTLLocale(locale);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap">
        {/* Home icon */}
        <li className="flex items-center">
          <Link
            href={getPortalPath('/')}
            className="p-1 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            aria-label="Portal home"
          >
            <Home size={14} />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              <ChevronRight
                size={12}
                className={cn(
                  'text-surface-300 dark:text-surface-600 flex-shrink-0',
                  isRTL && 'rotate-180'
                )}
                aria-hidden="true"
              />
              {isLast || !item.href ? (
                <span
                  className={cn(breadcrumbItemVariants({ active: isLast }))}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(breadcrumbItemVariants({ active: false }))}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export { breadcrumbItemVariants };
