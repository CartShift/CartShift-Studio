'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { Check, X, Loader2 } from 'lucide-react';

export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 rounded-xl font-outfit font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 dark:focus-visible:ring-offset-surface-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 overflow-hidden touch-manipulation active:scale-[0.97]",
  {
    variants: {
      variant: {
        primary: [
          "bg-gradient-to-b from-primary-500 to-primary-600 text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(2,132,199,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-primary-400 hover:to-primary-600",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_24px_rgba(2,132,199,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "active:shadow-[0_0_0_rgba(0,0,0,0),0_2px_8px_rgba(2,132,199,0.2),inset_0_1px_2px_rgba(0,0,0,0.1)]",
          "shine-sweep",
        ],
        secondary: [
          "bg-surface-100 dark:bg-white/[0.08] text-surface-700 dark:text-white",
          "border border-surface-200/80 dark:border-white/[0.08]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:bg-surface-200/80 dark:hover:bg-white/[0.12]",
          "hover:border-surface-300 dark:hover:border-white/[0.12]",
          "hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        ],
        outline: [
          "bg-transparent text-surface-700 dark:text-surface-200",
          "border-2 border-surface-200 dark:border-white/[0.12]",
          "hover:bg-surface-50 dark:hover:bg-white/[0.04]",
          "hover:border-surface-300 dark:hover:border-white/[0.18]",
        ],
        ghost: [
          "bg-transparent text-surface-600 dark:text-surface-300",
          "hover:bg-surface-100/80 dark:hover:bg-white/[0.06]",
          "hover:text-surface-900 dark:hover:text-white",
        ],
        danger: [
          "bg-gradient-to-b from-rose-500 to-rose-600 text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(244,63,94,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-rose-400 hover:to-rose-600",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_24px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
        ],
        success: [
          "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(16,185,129,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:from-emerald-400 hover:to-emerald-600",
          "hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_24px_rgba(16,185,129,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]",
        ],
        gradient: [
          "bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 bg-[length:200%_100%] text-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_16px_rgba(192,38,211,0.2),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "hover:bg-[position:100%_0] hover:shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_28px_rgba(192,38,211,0.3)]",
          "transition-[background-position,box-shadow,transform] duration-500",
        ],
        glass: [
          "bg-white/10 dark:bg-white/[0.06] backdrop-blur-md text-surface-900 dark:text-white",
          "border border-white/30 dark:border-white/[0.1]",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "hover:bg-white/20 dark:hover:bg-white/[0.1]",
          "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]",
        ],
      },
      size: {
        xs: "h-7 px-2.5 text-xs gap-1",
        sm: "h-9 px-4 text-sm gap-1.5",
        md: "h-11 px-6 text-base gap-2",
        lg: "h-14 px-8 text-lg gap-2.5",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
      btnState: {
        idle: "",
        loading: "cursor-wait opacity-90",
        success: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white border-none shadow-none",
        error: "bg-gradient-to-b from-rose-500 to-rose-600 text-white border-none shadow-none",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      btnState: "idle",
    },
  }
);

export interface ButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'
>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant,
      size,
      btnState,
      className,
      children,
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const currentState = loading ? 'loading' : (btnState || 'idle');

    const isDisabled =
      disabled ||
      currentState === 'loading' ||
      currentState === 'success' ||
      currentState === 'error';

    return (
      <motion.button
        ref={ref}
        {...props}
        whileHover={!isDisabled && currentState === 'idle' ? { y: -1 } : undefined}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        className={cn(
          buttonVariants({
            variant,
            size,
            btnState: currentState as any,
            className
          })
        )}
        disabled={isDisabled}
      >
        {variant === 'primary' && currentState === 'idle' && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rtl:bg-gradient-to-l translate-x-[-100%] group-hover:translate-x-[100%] rtl:translate-x-[100%] rtl:group-hover:translate-x-[-100%] transition-transform duration-700 pointer-events-none"></span>
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          <AnimatePresence mode="wait">
            {currentState === 'loading' && (
              <motion.span
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center"
              >
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={3} />
              </motion.span>
            )}
            {currentState === 'success' && (
              <motion.span
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Check className="h-5 w-5" strokeWidth={3} />
              </motion.span>
            )}
            {currentState === 'error' && (
              <motion.span
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <X className="h-5 w-5" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>

          {(currentState === 'idle') && (
            <>
              {leftIcon}
              {children}
              {rightIcon}
            </>
          )}

          {/* For success/error states, we might want to show different text or just the icon.
              The original component showed "Success!" or "Error", but keeping just the icon + original text
              or swapping content is a design choice. Let's keep it simple: show Success!/Error text if provided,
              or just the icon if that's preferred. The original reused children for idle/loading.
              Let's show children only if idle. If success/error, standard text.
          */}
          {currentState === 'success' && <span className="ml-1">Success!</span>}
          {currentState === 'error' && <span className="ml-1">Error</span>}
        </span>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

