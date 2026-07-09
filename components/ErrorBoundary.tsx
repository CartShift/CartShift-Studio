'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '@/lib/error-handler';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface InnerProps {
  children: ReactNode;
  fallback?: ReactNode;
  t: (key: string) => string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryInner extends Component<InnerProps, State> {
  constructor(props: InnerProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logError('ErrorBoundary caught an error', error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-surface-50 dark:bg-surface-900">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-surface-900 dark:text-white font-outfit">
                {t('title')}
              </h1>
              <p className="text-surface-600 dark:text-surface-300 font-medium">
                {t('description')}
              </p>
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <details className="mt-4 text-start">
                  <summary className="cursor-pointer text-sm text-surface-500 dark:text-surface-400 font-bold uppercase tracking-widest">
                    {t('details')}
                  </summary>
                  <pre className="mt-2 p-4 bg-surface-100 dark:bg-surface-800 rounded-xl text-xs overflow-auto border border-surface-200 dark:border-surface-700">
                    {this.state.error.toString()}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={this.handleReset} variant="primary" className="px-8 font-outfit">
                {t('tryAgain')}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
                className="px-8 font-outfit"
              >
                {t('refresh')}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const t = useTranslations('errorBoundary');
  return (
    <ErrorBoundaryInner t={t as unknown as (key: string) => string} fallback={fallback}>
      {children}
    </ErrorBoundaryInner>
  );
}
