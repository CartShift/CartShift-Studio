'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// GPU-optimized card variants - uses will-change for smooth hover animations
const cardVariants = cva(
  'relative rounded-2xl overflow-hidden transition-[transform,box-shadow,border-color] duration-300 will-change-transform transform-gpu [backface-visibility:hidden]',
  {
    variants: {
      variant: {
        default: [
          'bg-white dark:bg-surface-900/80',
          'border border-surface-200/80 dark:border-white/[0.08]',
          'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]',
          'dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15)]',
        ],
        glass: [
          'bg-white/70 dark:bg-white/[0.03]',
          'backdrop-blur-xl backdrop-saturate-150',
          'border border-white/50 dark:border-white/[0.08]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
        ],
        elevated: [
          'bg-white dark:bg-surface-900',
          'border border-surface-100 dark:border-surface-800',
          'shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1),0_8px_32px_-8px_rgba(0,0,0,0.08)]',
          'dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4),0_8px_32px_-8px_rgba(0,0,0,0.3)]',
        ],
        gradient: [
          'bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950',
          'border border-surface-200/60 dark:border-white/[0.06]',
          'shadow-[0_2px_16px_rgba(0,0,0,0.05)]',
          'dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]',
        ],
        interactive: [
          'bg-white dark:bg-surface-900/90',
          'border border-surface-200/70 dark:border-white/[0.08]',
          'shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
          'dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]',
          'cursor-pointer select-none',
        ],
        // Legacy support
        'liquid-glass': [
          'bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl',
          'border border-white/50 dark:border-white/[0.08]',
        ],
      },
      padding: {
        none: '',
        sm: 'p-3',
        default: 'p-4 md:p-5',
        lg: 'p-5 md:p-6',
      },
      hover: {
        true: '',
        false: '',
        lift: '',
        glow: '',
        scale: '',
      },
      // Keep 'glow' variant for backward compatibility map, though we use hover effects now mostly
      glow: {
        glow: '',
        none: '',
        subtle: '',
        lift: '',
      },
      accent: {
        none: '',
        primary:
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-primary-500 before:to-primary-600',
        accent:
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-accent-500 before:to-accent-600',
        gradient:
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-primary-500 before:via-accent-500 before:to-primary-500',
        success:
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-emerald-500 before:to-teal-500',
        warning:
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-amber-500 before:to-orange-500',
        true: 'border-accent-500/30', // Legacy support
        false: '',
      },
    },
    compoundVariants: [
      // Default hover
      {
        hover: true,
        className: [
          'hover:border-surface-300 dark:hover:border-white/15',
          'hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1),0_16px_40px_-8px_rgba(0,0,0,0.08)]',
          'dark:hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.4),0_16px_40px_-8px_rgba(0,0,0,0.3)]',
        ],
      },
      // Lift hover effect
      {
        hover: 'lift',
        className: [
          'hover:-translate-y-1',
          'hover:border-surface-300 dark:hover:border-white/15',
          'hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.12),0_20px_48px_-12px_rgba(0,0,0,0.1)]',
          'dark:hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.5),0_20px_48px_-12px_rgba(0,0,0,0.4)]',
        ],
      },
      // Glow hover effect
      {
        hover: 'glow',
        className: [
          'hover:border-primary-300/60 dark:hover:border-primary-500/30',
          'hover:shadow-[0_0_0_1px_rgba(var(--color-primary-600-rgb),0.1),0_8px_24px_rgba(var(--color-primary-600-rgb),0.15),0_16px_48px_rgba(var(--color-primary-600-rgb),0.1)]',
          'dark:hover:shadow-[0_0_0_1px_rgba(var(--color-primary-600-rgb),0.2),0_8px_24px_rgba(var(--color-primary-600-rgb),0.2),0_16px_48px_rgba(var(--color-primary-600-rgb),0.1)]',
        ],
      },
      // Scale hover effect
      {
        hover: 'scale',
        className: [
          'hover:scale-[1.02]',
          'hover:border-surface-300 dark:hover:border-white/15',
          'hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.1)]',
          'dark:hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.4)]',
        ],
      },
      // Interactive card special hover
      {
        variant: 'interactive',
        hover: true,
        className: ['hover:bg-surface-50 dark:hover:bg-surface-800/80', 'active:scale-[0.99]'],
      },
      // Legacy glow prop support: if glow="glow" is passed, trigger glow hover effect style
      {
        glow: 'glow',
        className: [
          'before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-primary-500 via-accent-500 to-primary-500',
        ],
      },
    ],
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      hover: false,
      accent: 'none',
      glow: 'none',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  noPadding?: boolean;
  hoverEffect?: boolean | 'lift' | 'glow' | 'scale';
}

export const Card = ({
  children,
  className,
  noPadding = false,
  hoverEffect = false,
  variant,
  padding,
  hover,
  accent,
  glow,
  ...props
}: CardProps) => {
  // Map hoverEffect prop to hover variant
  const resolvedHover =
    hoverEffect === true
      ? true
      : hoverEffect === 'lift' || hoverEffect === 'glow' || hoverEffect === 'scale'
        ? hoverEffect
        : hover;

  return (
    <div
      className={cn(
        cardVariants({
          variant,
          padding: noPadding ? 'none' : padding || 'default',
          hover: resolvedHover,
          accent,
          glow, // Pass through legay glow prop
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export { cardVariants };

// Card Header
export const CardHeader = ({
  children,
  className,
  noBorder = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { noBorder?: boolean }) => {
  return (
    <div
      className={cn(
        'px-4 md:px-5 py-4 flex items-center justify-between gap-4',
        !noBorder && 'border-b border-surface-200/50 dark:border-white/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Title
export const CardTitle = ({
  children,
  className,
  as: Component = 'h3',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' }) => {
  return (
    <Component
      className={cn(
        'text-lg font-outfit font-bold text-surface-900 dark:text-white tracking-tight leading-tight',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
};

// Card Description
export const CardDescription = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn('text-sm text-surface-500 dark:text-surface-400 leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
};

// Card Content
export const CardContent = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn('p-4 md:p-5', className)} {...props}>
      {children}
    </div>
  );
};

// Card Footer
export const CardFooter = ({
  children,
  className,
  noBorder = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { noBorder?: boolean }) => {
  return (
    <div
      className={cn(
        'px-4 md:px-5 py-4 flex items-center gap-3',
        !noBorder && 'border-t border-surface-200/50 dark:border-white/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
