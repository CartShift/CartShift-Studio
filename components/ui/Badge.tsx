import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold whitespace-nowrap transition-all duration-200',
  {
    variants: {
      variant: {
        blue: [
          'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300',
          'border border-blue-200/60 dark:border-blue-400/20',
          'shadow-[0_1px_2px_rgba(59,130,246,0.06)]',
        ],
        green: [
          'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          'border border-emerald-200/60 dark:border-emerald-400/20',
          'shadow-[0_1px_2px_rgba(16,185,129,0.06)]',
        ],
        yellow: [
          'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
          'border border-amber-200/60 dark:border-amber-400/20',
          'shadow-[0_1px_2px_rgba(245,158,11,0.06)]',
        ],
        red: [
          'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
          'border border-rose-200/60 dark:border-rose-400/20',
          'shadow-[0_1px_2px_rgba(244,63,94,0.06)]',
        ],
        purple: [
          'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300',
          'border border-purple-200/60 dark:border-purple-400/20',
          'shadow-[0_1px_2px_rgba(168,85,247,0.06)]',
        ],
        gray: [
          'bg-surface-100/80 dark:bg-white/[0.06] text-surface-600 dark:text-surface-300',
          'border border-surface-200/60 dark:border-white/[0.08]',
        ],
        emerald: [
          'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
          'border border-emerald-200/60 dark:border-emerald-400/20',
          'shadow-[0_1px_2px_rgba(16,185,129,0.06)]',
        ],
        orange: [
          'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300',
          'border border-orange-200/60 dark:border-orange-400/20',
          'shadow-[0_1px_2px_rgba(249,115,22,0.06)]',
        ],
        cyan: [
          'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
          'border border-cyan-200/60 dark:border-cyan-400/20',
          'shadow-[0_1px_2px_rgba(6,182,212,0.06)]',
        ],
        pink: [
          'bg-pink-50 dark:bg-pink-500/15 text-pink-700 dark:text-pink-300',
          'border border-pink-200/60 dark:border-pink-400/20',
          'shadow-[0_1px_2px_rgba(236,72,153,0.06)]',
        ],
        // Solid variants for more prominent badges
        'solid-blue': [
          'bg-blue-500 text-white border border-blue-600/20',
          'shadow-[0_2px_4px_rgba(59,130,246,0.2)]',
        ],
        'solid-green': [
          'bg-emerald-500 text-white border border-emerald-600/20',
          'shadow-[0_2px_4px_rgba(16,185,129,0.2)]',
        ],
        'solid-yellow': [
          'bg-amber-500 text-white border border-amber-600/20',
          'shadow-[0_2px_4px_rgba(245,158,11,0.2)]',
        ],
        'solid-red': [
          'bg-rose-500 text-white border border-rose-600/20',
          'shadow-[0_2px_4px_rgba(244,63,94,0.2)]',
        ],
        'solid-purple': [
          'bg-purple-500 text-white border border-purple-600/20',
          'shadow-[0_2px_4px_rgba(168,85,247,0.2)]',
        ],
        // Gradient variant
        gradient: [
          'bg-gradient-to-r from-primary-500 to-accent-500 text-white',
          'border border-white/10',
          'shadow-[0_2px_8px_rgba(var(--color-accent-600-rgb),0.2)]',
        ],
      },
      size: {
        xs: 'px-1.5 py-0.5 text-[10px] rounded',
        sm: 'px-2 py-0.5 text-[11px] rounded-md',
        md: 'px-2.5 py-1 text-xs rounded-lg',
        lg: 'px-3 py-1.5 text-sm rounded-lg',
      },
      glow: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'blue', glow: true, className: 'shadow-[0_0_12px_rgba(59,130,246,0.3)]' },
      { variant: 'green', glow: true, className: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' },
      { variant: 'yellow', glow: true, className: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' },
      { variant: 'red', glow: true, className: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' },
      { variant: 'purple', glow: true, className: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' },
      {
        variant: 'gradient',
        glow: true,
        className: 'shadow-[0_0_16px_rgba(var(--color-accent-600-rgb),0.4)]',
      },
    ],
    defaultVariants: {
      variant: 'gray',
      size: 'md',
      glow: false,
    },
  }
);

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
export type BadgeSize = VariantProps<typeof badgeVariants>['size'];

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotPulse?: boolean;
}

// Dot color mapping for status indicators
const dotColorMap: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
  purple: 'bg-purple-500',
  gray: 'bg-surface-400',
  emerald: 'bg-emerald-500',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
  'solid-blue': 'bg-white/80',
  'solid-green': 'bg-white/80',
  'solid-yellow': 'bg-white/80',
  'solid-red': 'bg-white/80',
  'solid-purple': 'bg-white/80',
  gradient: 'bg-white/80',
};

export const Badge = ({
  className,
  variant = 'gray',
  size,
  glow,
  dot,
  dotPulse,
  children,
  ...props
}: BadgeProps) => {
  const variantKey = variant?.toString() || 'gray';

  return (
    <span className={cn(badgeVariants({ variant, size, glow }), className)} {...props}>
      {dot && (
        <span className="relative flex h-2 w-2">
          {dotPulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
                dotColorMap[variantKey] || 'bg-surface-400'
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              dotColorMap[variantKey] || 'bg-surface-400'
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
};

export { badgeVariants };
