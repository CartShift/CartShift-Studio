'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'relative rounded-2xl overflow-hidden transition-[transform,box-shadow,border-color,background-color] duration-300 transform-gpu [backface-visibility:hidden]',
  {
    variants: {
      variant: {
        default: [
          'bg-white/90 dark:bg-surface-900/70 backdrop-blur-xl',
          'border border-surface-200/70 dark:border-white/[0.085]',
          'shadow-[0_1px_1px_rgba(25,45,70,0.03),0_16px_40px_-30px_rgba(25,45,70,0.28),inset_0_1px_0_rgba(255,255,255,0.65)]',
          'dark:shadow-[0_20px_50px_-34px_rgba(0,5,15,0.8),inset_0_1px_0_rgba(255,255,255,0.04)]',
        ],
        glass: [
          'bg-white/72 dark:bg-white/[0.035]',
          'backdrop-blur-xl backdrop-saturate-150',
          'border border-white/50 dark:border-white/[0.08]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]',
        ],
        elevated: [
          'bg-white/95 dark:bg-surface-900/90',
          'border border-surface-100 dark:border-surface-800',
          'shadow-card-hover-light',
          'dark:shadow-card-hover-dark',
        ],
        gradient: [
          'bg-gradient-to-br from-white to-surface-50 dark:from-surface-900 dark:to-surface-950',
          'border border-surface-200/60 dark:border-white/[0.06]',
          'shadow-sm',
        ],
        interactive: [
          'bg-white dark:bg-surface-900/90',
          'border border-surface-200/70 dark:border-white/[0.08]',
          'shadow-card-default',
          'dark:shadow-card-dark',
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
        sm: 'p-3.5',
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
          'hover:shadow-card-hover-light',
          'dark:hover:shadow-card-hover-dark',
        ],
      },
      // Lift hover effect
      {
        hover: 'lift',
        className: [
          'hover:-translate-y-0.5',
          'hover:border-surface-300 dark:hover:border-white/15',
          'hover:shadow-card-lift-light',
          'dark:hover:shadow-card-lift-dark',
        ],
      },
      // Glow hover effect
      {
        hover: 'glow',
        className: [
          'hover:border-primary-300/60 dark:hover:border-primary-500/30',
          'hover:shadow-glow-primary',
        ],
      },
      // Scale hover effect
      {
        hover: 'scale',
        className: [
          'hover:scale-[1.02]',
          'hover:border-surface-300 dark:hover:border-white/15',
          'hover:shadow-card-hover-light',
          'dark:hover:shadow-card-hover-dark',
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
          glow, // Pass through legacy glow prop
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
        'px-3.5 md:px-4 py-3.5 flex items-center justify-between gap-3',
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
        'text-base font-outfit font-bold text-surface-900 dark:text-white tracking-tight leading-tight',
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
    <div className={cn('p-3.5 md:p-4', className)} {...props}>
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
        'px-3.5 md:px-4 py-3.5 flex items-center gap-3',
        !noBorder && 'border-t border-surface-200/50 dark:border-white/[0.06]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Card Section Title - Portal-style uppercase section headers
export const CardSectionTitle = ({
  children,
  icon: Icon,
  iconClassName,
  className,
  as: Component = 'h3',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconClassName?: string;
  as?: 'h2' | 'h3' | 'h4' | 'h5';
}) => {
  return (
    <Component
      className={cn(
        'text-xs font-semibold text-surface-500 dark:text-surface-400 tracking-wide flex items-center gap-2',
        className
      )}
      {...props}
    >
      {Icon && <Icon size={14} className={iconClassName} />}
      {children}
    </Component>
  );
};
