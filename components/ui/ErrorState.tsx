'use client';

import { ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw, ArrowLeft, Headphones, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { getPortalPath } from '@/lib/utils/portal-paths';

const errorStateVariants = cva('flex items-center', {
  variants: {
    variant: {
      default: 'py-16 flex-col justify-center text-center',
      inline:
        'gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40',
      fullPage: 'min-h-[60vh] flex-col justify-center p-8 text-center',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface ErrorStateProps extends VariantProps<typeof errorStateVariants> {
  title?: string;
  message?: string;
  errorCode?: string;
  icon?: ReactNode;
  onRetry?: () => void;
  onGoBack?: () => void;
  showHomeLink?: boolean;
  showSupportLink?: boolean;
  className?: string;
}

export function ErrorState({
  title,
  message,
  errorCode,
  variant,
  icon,
  onRetry,
  onGoBack,
  showHomeLink = false,
  showSupportLink = true,
  className,
}: ErrorStateProps) {
  const t = useTranslations();

  const defaultTitle = t('portal.errorState.title');
  const defaultMessage = t('portal.errorState.message');

  if (variant === 'inline') {
    return (
      <div className={cn(errorStateVariants({ variant }), className)} role="alert">
        <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
            {title || defaultTitle}
          </p>
          {message && <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{message}</p>}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:underline underline-offset-2"
          >
            {t('portal.errorState.retry')}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'fullPage') {
    return (
      <div className={cn(errorStateVariants({ variant }), className)} role="alert">
        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-rose-100 dark:border-rose-900/30 shadow-xl shadow-rose-500/10">
          {icon || <AlertCircle size={44} className="text-rose-500" />}
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
          {title || defaultTitle}
        </h1>
        <p className="text-surface-500 dark:text-surface-400 max-w-md mb-8 leading-relaxed">
          {message || defaultMessage}
        </p>
        {errorCode && (
          <div className="mb-8 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-500 text-xs font-mono">
            Error Code: {errorCode}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <Button onClick={onRetry} className="shadow-lg shadow-blue-500/20">
              <RefreshCw size={16} className="me-2" />
              {t('portal.errorState.retry')}
            </Button>
          )}
          {onGoBack && (
            <Button variant="outline" onClick={onGoBack}>
              <ArrowLeft size={16} className="me-2 rtl:rotate-180" />
              {t('portal.errorState.goBack')}
            </Button>
          )}
          {showHomeLink && (
            <Link href={getPortalPath('/')}>
              <Button variant="outline">
                <Home size={16} className="me-2" />
                {t('portal.errorState.home')}
              </Button>
            </Link>
          )}
          {showSupportLink && (
            <Button variant="ghost" className="text-surface-500">
              <Headphones size={16} className="me-2" />
              {t('portal.errorState.contactSupport')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn(errorStateVariants({ variant }), className)} role="alert">
      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-900/30">
        {icon || <AlertCircle size={28} className="text-rose-500" />}
      </div>
      <h2 className="text-xl font-bold text-surface-900 dark:text-white mb-2">
        {title || defaultTitle}
      </h2>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-sm mb-6">
        {message || defaultMessage}
      </p>
      {errorCode && (
        <div className="mb-6 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500 text-xs font-mono">
          {errorCode}
        </div>
      )}
      <div className="flex items-center gap-3">
        {onRetry && (
          <Button size="sm" onClick={onRetry}>
            <RefreshCw size={14} className="me-2" />
            {t('portal.errorState.retry')}
          </Button>
        )}
        {onGoBack && (
          <Button size="sm" variant="outline" onClick={onGoBack}>
            <ArrowLeft size={14} className="me-2 rtl:rotate-180" />
            {t('portal.errorState.goBack')}
          </Button>
        )}
      </div>
    </div>
  );
}

export { errorStateVariants };
