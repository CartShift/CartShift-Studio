'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "liquid-glass liquid-glass-intense liquid-glass-highlight rounded-2xl md:rounded-3xl relative overflow-hidden transition-all duration-300",
  {
    variants: {
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6 md:p-8",
      },
      glow: {
        glow: "liquid-glass-glow",
        none: "",
        subtle: "",
        lift: "",
      },
      accent: {
        true: "border-accent-500/30",
        false: "",
      },
      hover: {
        true: "hover:scale-[1.02] hover:-translate-y-1",
        false: "",
      },
    },
    defaultVariants: {
      padding: "default",
      glow: "none",
      accent: false,
      hover: false,
    },
  }
);

interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover,
  glow,
  accent,
  padding,
  ...props
}) => {
  return (
    <div
      className={cn(cardVariants({ glow, accent, hover, padding, className }))}
      {...props}
    >
      {glow === 'glow' && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-t-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className }) => {
  return <div className={cn('mb-6', className)}>{children}</div>;
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className }) => {
  return (
    <h3
      className={cn(
        'text-xl md:text-2xl lg:text-3xl font-display font-bold text-surface-900 dark:text-white leading-tight tracking-tight',
        className
      )}
    >
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className }) => {
  return (
    <div className={cn('text-surface-600 dark:text-surface-300 leading-relaxed', className)}>
      {children}
    </div>
  );
};

