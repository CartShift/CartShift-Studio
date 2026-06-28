'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration';
import { useTranslations } from 'next-intl';

const emptyStateVariants = cva('flex flex-col items-center justify-center text-center px-6 py-10', {
  variants: {
    variant: {
      default:
        'bg-surface-50/55 dark:bg-white/[0.018] border border-dashed border-surface-200/80 dark:border-white/[0.09] rounded-2xl',
      plain: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ActionButton {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
}

interface EmptyStateProps extends VariantProps<typeof emptyStateVariants> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  primaryAction?: ActionButton;
  secondaryAction?: ActionButton;
  className?: string;
  illustration?: 'activity' | 'requests' | 'files';
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  primaryAction,
  secondaryAction,
  variant,
  className,
  illustration,
}: EmptyStateProps) => {
  return (
    <div className={cn(emptyStateVariants({ variant }), className)}>
      {illustration ? (
        <EmptyStateIllustration variant={illustration} className="mb-4" />
      ) : (
        <div className="mb-5 w-14 h-14 bg-primary-50 dark:bg-primary-500/10 rounded-2xl border border-primary-100/80 dark:border-primary-400/15 flex items-center justify-center shadow-inner">
          <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden />
        </div>
      )}

      <h3 className="text-lg font-semibold tracking-tight text-surface-900 dark:text-white font-outfit mb-1.5">
        {title}
      </h3>

      <p className="text-surface-500 dark:text-surface-400 text-sm max-w-[44ch] leading-relaxed text-pretty mb-6">
        {description}
      </p>

      {(action || primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {action}

          {primaryAction &&
            (primaryAction.href ? (
              <Link href={primaryAction.href}>
                <Button variant="primary" className="gap-2" onClick={primaryAction.onClick}>
                  {primaryAction.icon}
                  {primaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant="primary" onClick={primaryAction.onClick} className="gap-2">
                {primaryAction.icon}
                {primaryAction.label}
              </Button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button
                  variant={secondaryAction.variant === 'ghost' ? 'ghost' : 'outline'}
                  className="gap-2"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.icon}
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button
                variant={secondaryAction.variant === 'ghost' ? 'ghost' : 'outline'}
                onClick={secondaryAction.onClick}
                className="gap-2"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </Button>
            ))}
        </div>
      )}
    </div>
  );
};

export function EmptyColumnState({ className }: { className?: string }) {
  const t = useTranslations('portal.common');

  return (
    <div
      className={cn(
        'py-10 border border-dashed border-surface-200 dark:border-surface-800 rounded-xl flex flex-col items-center justify-center text-center',
        className
      )}
    >
      <div className="w-10 h-10 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-center mb-2 text-surface-400">
        <Plus size={18} aria-hidden />
      </div>
      <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">
        {t('noItems')}
      </span>
    </div>
  );
}

export { emptyStateVariants };
