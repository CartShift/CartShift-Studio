'use client';

import React, { useCallback } from 'react';
import { Toaster as Sonner, toast } from 'sonner';
import { motion } from '@/lib/motion';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

const toastVariants = cva(
  'relative w-80 max-w-[calc(100vw-2rem)] p-4 rounded-2xl backdrop-blur-xl shadow-xl border overflow-hidden transition-colors',
  {
    variants: {
      type: {
        success:
          'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/40',
        error: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/40',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/40',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/40',
      },
    },
    defaultVariants: {
      type: 'info',
    },
  }
);

const toastIconVariants = cva('flex-shrink-0 mt-0.5', {
  variants: {
    type: {
      success: 'text-emerald-500',
      error: 'text-rose-500',
      warning: 'text-amber-500',
      info: 'text-blue-500',
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

const toastTitleVariants = cva('font-bold text-sm', {
  variants: {
    type: {
      success: 'text-emerald-900 dark:text-emerald-200',
      error: 'text-rose-900 dark:text-rose-200',
      warning: 'text-amber-900 dark:text-amber-200',
      info: 'text-blue-900 dark:text-blue-200',
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

const toastProgressVariants = cva('absolute bottom-0 start-0 h-1 rounded-b-2xl', {
  variants: {
    type: {
      success: 'bg-emerald-400',
      error: 'bg-rose-400',
      warning: 'bg-amber-400',
      info: 'bg-blue-400',
    },
  },
  defaultVariants: {
    type: 'info',
  },
});

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
}

// Re-export this hook with the same API surface as before
export function useToast() {
  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, action?: ToastAction, duration?: number) => {
      const toastDuration = duration ?? (type === 'error' ? 8000 : 5000);

      const id = toast.custom(
        t => (
          <ToastItem
            id={t}
            type={type}
            title={title}
            message={message}
            action={action}
            onDismiss={() => toast.dismiss(t)}
            duration={toastDuration}
          />
        ),
        {
          duration: toastDuration,
        }
      );

      return String(id);
    },
    []
  );

  return {
    toasts: [], // No longer accessible/needed with sonner, return empty or mock if strictly typed elsewhere
    addToast: (toastObj: Omit<Toast, 'id'>) =>
      showToast(
        toastObj.type,
        toastObj.title,
        toastObj.message,
        toastObj.action,
        toastObj.duration
      ),
    removeToast: (id: string) => toast.dismiss(id),
    success: (title: string, message?: string, action?: ToastAction) =>
      showToast('success', title, message, action),
    error: (title: string, message?: string, action?: ToastAction) =>
      showToast('error', title, message, action),
    warning: (title: string, message?: string, action?: ToastAction) =>
      showToast('warning', title, message, action),
    info: (title: string, message?: string, action?: ToastAction) =>
      showToast('info', title, message, action),
  };
}

interface ToastProviderProps {
  children?: React.ReactNode;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
}

export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: ToastProviderProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {children}
      <Sonner
        position={isMobile ? 'top-center' : position}
        visibleToasts={isMobile ? 3 : maxToasts}
        gap={12} // gap-3 equivalent
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'w-full flex justify-end', // Ensure toasts align right in the container
          },
        }}
      />
    </>
  );
}

interface ToastItemProps extends VariantProps<typeof toastVariants> {
  id: string | number;
  type: ToastType;
  title: string;
  message?: string;
  action?: ToastAction;
  onDismiss: () => void;
  duration: number;
}

function ToastItem({ type, title, message, action, onDismiss, duration }: ToastItemProps) {
  const t = useTranslations();

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = icons[type || 'info'];

  return (
    <div
      className={cn(toastVariants({ type }))}
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        <Icon size={20} className={cn(toastIconVariants({ type }))} />
        <div className="flex-1 min-w-0">
          <p className={cn(toastTitleVariants({ type }))}>{title}</p>
          {message && (
            <p className="text-xs text-surface-600 dark:text-surface-400 mt-1 leading-relaxed">
              {message}
            </p>
          )}
          {action && (
            <button
              onClick={e => {
                e.stopPropagation();
                action.onClick();
                onDismiss();
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline underline-offset-2"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={e => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-200/50 dark:hover:bg-surface-800/50 transition-colors"
          aria-label={t('portal.toast.dismiss') || 'Dismiss'}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
          className={cn(toastProgressVariants({ type }))}
        />
      )}
    </div>
  );
}

export { toastVariants, toastIconVariants, toastTitleVariants, toastProgressVariants };
