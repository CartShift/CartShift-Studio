'use client';

import React, { ComponentType, ReactNode } from 'react';
import { Logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class PortalShellErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentName = this.props.name || 'UnknownComponent';
    Logger.error('Portal component error caught', error, {
      component: componentName,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-start gap-3 p-4 border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 rounded-lg">
            <div className="text-red-600 dark:text-red-400 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9-18 0 9 18 0 9 18A9 9 0 011-18 0m-6 0h.01"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-900 dark:text-red-100 text-sm mb-1">
                {this.props.name || 'Component'} Error
              </h4>
              <p className="text-xs text-red-700 dark:text-red-300">
                Something went wrong. Please refresh the page.
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium underline decoration-1 underline-offset-2"
            >
              Refresh
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export function withPortalShellErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode,
  name?: string
) {
  const WrappedComponent = (props: P) => (
    <PortalShellErrorBoundary fallback={fallback} name={name}>
      <Component {...props} />
    </PortalShellErrorBoundary>
  );

  WrappedComponent.displayName = `withPortalShellErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}
