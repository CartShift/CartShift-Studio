'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global error boundary for catching React rendering errors.
 * Wrap portal routes or critical components to prevent full-page crashes.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <DashboardClient />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service in production
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md text-center border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-900/10">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900 dark:text-white font-outfit">
                  Something went wrong
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                  An unexpected error occurred. Please try refreshing.
                </p>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="w-full p-3 rounded-xl bg-surface-100 dark:bg-surface-900 text-xs text-rose-600 dark:text-rose-400 overflow-x-auto text-start">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-3 pt-2">
                <Button onClick={this.handleReset} variant="outline" size="sm">
                  <RefreshCw size={16} className="me-2" />
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} size="sm">
                  Refresh Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
