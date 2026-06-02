import { cva, type VariantProps } from 'class-variance-authority';

/** Flat semantic icon surfaces for portal actions (no gradient stacks). */
export const portalIconSurfaceVariants = cva(
  'flex items-center justify-center text-white shadow-sm transition-colors',
  {
    variants: {
      tone: {
        primary: 'bg-primary-600 dark:bg-primary-500',
        accent: 'bg-accent-600 dark:bg-accent-500',
        success: 'bg-emerald-600 dark:bg-emerald-500',
        warning: 'bg-amber-600 dark:bg-amber-500',
        neutral: 'bg-surface-700 dark:bg-surface-600',
      },
      size: {
        sm: 'w-9 h-9 rounded-lg',
        md: 'w-10 h-10 rounded-xl',
        lg: 'w-11 h-11 rounded-xl',
      },
    },
    defaultVariants: {
      tone: 'primary',
      size: 'md',
    },
  }
);

export type PortalIconSurfaceTone = NonNullable<
  VariantProps<typeof portalIconSurfaceVariants>['tone']
>;

export const portalSurfaceHeaderClass =
  'border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50';

export const portalPrimaryButtonClass =
  'bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white';

export const portalProgressBarClass = 'bg-primary-600 dark:bg-primary-500';

export const portalStatSurfaceVariants = cva('rounded-xl border p-4', {
  variants: {
    tone: {
      primary: 'bg-primary-50 dark:bg-primary-950/30 border-primary-200/50 dark:border-primary-800/30',
      accent: 'bg-accent-50 dark:bg-accent-950/30 border-accent-200/50 dark:border-accent-800/30',
      success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30',
      warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30',
      neutral: 'bg-surface-50 dark:bg-surface-900/50 border-surface-200 dark:border-surface-800',
    },
  },
  defaultVariants: { tone: 'neutral' },
});
