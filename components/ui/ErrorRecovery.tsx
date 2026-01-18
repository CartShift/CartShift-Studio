'use client';

/**
 * ErrorRecovery Component
 *
 * A reusable component for displaying errors with recovery actions.
 * Supports inline, expanded, and card variants with retry functionality.
 */

import { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import { motion, AnimatePresence } from '@/lib/motion';

const errorRecoveryVariants = cva('', {
  variants: {
    variant: {
      inline: 'flex items-center gap-3 p-3 rounded-xl',
      card: 'p-5 rounded-2xl',
      minimal: 'flex items-center gap-2 p-2',
    },
    severity: {
      low: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/30',
      medium: 'bg-orange-50 dark:bg-orange-900/10 border-orange-200/50 dark:border-orange-800/30',
      high: 'bg-rose-50 dark:bg-rose-900/10 border-rose-200/50 dark:border-rose-900/30',
    },
  },
  defaultVariants: {
    variant: 'card',
    severity: 'medium',
  },
});

const iconColorVariants = cva('', {
  variants: {
    severity: {
      low: 'text-amber-500',
      medium: 'text-orange-500',
      high: 'text-rose-500',
    },
  },
  defaultVariants: {
    severity: 'medium',
  },
});

const titleColorVariants = cva('font-bold', {
  variants: {
    severity: {
      low: 'text-amber-900 dark:text-amber-200',
      medium: 'text-orange-900 dark:text-orange-200',
      high: 'text-rose-900 dark:text-rose-200',
    },
  },
  defaultVariants: {
    severity: 'medium',
  },
});

const messageColorVariants = cva('', {
  variants: {
    severity: {
      low: 'text-amber-700 dark:text-amber-300',
      medium: 'text-orange-700 dark:text-orange-300',
      high: 'text-rose-700 dark:text-rose-300',
    },
  },
  defaultVariants: {
    severity: 'medium',
  },
});

export interface ErrorRecoveryProps
  extends Omit<VariantProps<typeof errorRecoveryVariants>, 'severity'> {
  /** The error to display (will be parsed for user-friendly message) */
  error: unknown;
  /** Override the parsed title */
  title?: string;
  /** Override the parsed message */
  message?: string;
  /** Callback to retry the failed operation */
  onRetry?: () => void;
  /** Whether retry is in progress */
  isRetrying?: boolean;
  /** Callback to dismiss the error */
  onDismiss?: () => void;
  /** Show expandable error details */
  showDetails?: boolean;
  /** Additional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Additional CSS classes */
  className?: string;
}

export function ErrorRecovery({
  error,
  title,
  message,
  variant = 'card',
  onRetry,
  isRetrying = false,
  onDismiss,
  showDetails = false,
  action,
  className,
}: ErrorRecoveryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const errorDetails = getErrorMessage(error);
  const displayTitle = title ?? errorDetails.title;
  const displayMessage = message ?? errorDetails.message;
  const { severity, retryable, action: suggestedAction } = errorDetails;

  // Get the raw error message for details section
  const rawErrorMessage =
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error);

  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          errorRecoveryVariants({ variant, severity }),
          'border',
          className
        )}
        role="alert"
      >
        <AlertTriangle size={16} className={iconColorVariants({ severity })} />
        <span className={cn('text-sm', messageColorVariants({ severity }))}>
          {displayMessage}
        </span>
        {onRetry && retryable && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              'text-xs font-bold hover:underline underline-offset-2',
              messageColorVariants({ severity })
            )}
          >
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          errorRecoveryVariants({ variant, severity }),
          'border',
          className
        )}
        role="alert"
      >
        <div className={cn('p-2 rounded-lg', `bg-${severity === 'high' ? 'rose' : severity === 'medium' ? 'orange' : 'amber'}-100 dark:bg-${severity === 'high' ? 'rose' : severity === 'medium' ? 'orange' : 'amber'}-900/20`)}>
          <AlertTriangle size={18} className={iconColorVariants({ severity })} />
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm', titleColorVariants({ severity }))}>
            {displayTitle}
          </p>
          {displayMessage !== displayTitle && (
            <p className={cn('text-xs mt-0.5', messageColorVariants({ severity }))}>
              {displayMessage}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && retryable && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className={cn(
                'text-xs font-bold hover:underline underline-offset-2 disabled:opacity-50',
                messageColorVariants({ severity })
              )}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={cn('p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5', messageColorVariants({ severity }))}
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <Card
      className={cn(
        errorRecoveryVariants({ variant, severity }),
        'border',
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'p-2.5 rounded-xl flex-shrink-0',
            severity === 'high'
              ? 'bg-rose-100 dark:bg-rose-900/20'
              : severity === 'medium'
                ? 'bg-orange-100 dark:bg-orange-900/20'
                : 'bg-amber-100 dark:bg-amber-900/20'
          )}
        >
          <AlertTriangle size={22} className={iconColorVariants({ severity })} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn('text-base mb-1', titleColorVariants({ severity }))}>
            {displayTitle}
          </h3>
          <p className={cn('text-sm mb-4 leading-relaxed', messageColorVariants({ severity }))}>
            {displayMessage}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {onRetry && retryable && (
              <Button
                size="sm"
                variant={severity === 'high' ? 'danger' : 'primary'}
                onClick={onRetry}
                disabled={isRetrying}
                loading={isRetrying}
              >
                <RefreshCw size={14} className="me-1.5" />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>
            )}

            {action && (
              <Button size="sm" variant="outline" onClick={action.onClick}>
                {action.label}
              </Button>
            )}

            {suggestedAction && !action && !onRetry && (
              <span className={cn('text-xs font-medium', messageColorVariants({ severity }))}>
                💡 {suggestedAction}
              </span>
            )}

            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            )}
          </div>

          {showDetails && rawErrorMessage !== displayMessage && (
            <div className="mt-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium cursor-pointer',
                  messageColorVariants({ severity })
                )}
              >
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', isExpanded && 'rotate-180')}
                />
                {isExpanded ? 'Hide' : 'Show'} error details
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <pre
                      className={cn(
                        'mt-3 text-xs p-3 rounded-lg overflow-auto font-mono max-h-32',
                        severity === 'high'
                          ? 'bg-rose-100/50 dark:bg-rose-900/30'
                          : severity === 'medium'
                            ? 'bg-orange-100/50 dark:bg-orange-900/30'
                            : 'bg-amber-100/50 dark:bg-amber-900/30',
                        messageColorVariants({ severity })
                      )}
                    >
                      {rawErrorMessage}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export { errorRecoveryVariants };
