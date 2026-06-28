import type { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const portalMetricCardVariants = cva(
  [
    'group relative min-h-[7.25rem] overflow-hidden rounded-2xl border p-4',
    'bg-white/80 dark:bg-surface-900/65 backdrop-blur-xl',
    'border-surface-200/70 dark:border-white/[0.085]',
    'shadow-[0_14px_36px_-30px_rgba(25,45,70,0.35),inset_0_1px_0_rgba(255,255,255,0.65)]',
    'dark:shadow-[0_20px_45px_-34px_rgba(0,5,15,0.9),inset_0_1px_0_rgba(255,255,255,0.04)]',
    'transition-[transform,border-color,box-shadow] duration-200',
  ],
  {
    variants: {
      tone: {
        primary: 'hover:border-primary-300/70 dark:hover:border-primary-400/25',
        success: 'hover:border-emerald-300/70 dark:hover:border-emerald-400/25',
        warning: 'hover:border-amber-300/70 dark:hover:border-amber-400/25',
        neutral: 'hover:border-surface-300 dark:hover:border-white/[0.14]',
      },
      interactive: {
        true: 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0',
        false: '',
      },
    },
    defaultVariants: {
      tone: 'primary',
      interactive: false,
    },
  }
);

const toneStyles = {
  primary: {
    icon: 'bg-primary-50 text-primary-600 ring-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-400/15',
    value: 'text-primary-700 dark:text-primary-300',
    line: 'bg-primary-500',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/15',
    value: 'text-emerald-700 dark:text-emerald-300',
    line: 'bg-emerald-500',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/15',
    value: 'text-amber-700 dark:text-amber-300',
    line: 'bg-amber-500',
  },
  neutral: {
    icon: 'bg-surface-100 text-surface-600 ring-surface-200 dark:bg-white/[0.06] dark:text-surface-300 dark:ring-white/[0.08]',
    value: 'text-surface-900 dark:text-white',
    line: 'bg-surface-400',
  },
} as const;

interface PortalMetricCardProps extends VariantProps<typeof portalMetricCardVariants> {
  icon: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function PortalMetricCard({
  icon: Icon,
  label,
  value,
  meta,
  tone = 'primary',
  interactive,
  className,
}: PortalMetricCardProps) {
  const resolvedTone = tone ?? 'primary';
  const styles = toneStyles[resolvedTone];

  return (
    <div className={cn(portalMetricCardVariants({ tone, interactive }), className)}>
      <span className={cn('absolute inset-x-0 top-0 h-0.5 opacity-80', styles.line)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-surface-500 dark:text-surface-400">
            {label}
          </p>
          <p
            className={cn(
              'mt-3 font-outfit text-2xl font-semibold tracking-[-0.035em] tabular-nums',
              styles.value
            )}
          >
            {value}
          </p>
          {meta && (
            <div className="mt-2 text-xs text-surface-500 dark:text-surface-400">{meta}</div>
          )}
        </div>
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-transform duration-200 group-hover:scale-105',
            styles.icon
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
    </div>
  );
}

export { portalMetricCardVariants };
