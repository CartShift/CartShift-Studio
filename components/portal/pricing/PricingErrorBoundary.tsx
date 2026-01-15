'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PricingErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface PricingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * PricingErrorBoundary - Catches and handles errors in pricing calculator
 * Follows AGENTS.md guidelines for error handling and UX
 */
export class PricingErrorBoundary extends Component<
  PricingErrorBoundaryProps,
  PricingErrorBoundaryState
> {
  constructor(props: PricingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PricingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Pricing Calculator Error:', error, errorInfo);
    // In production, could send to error tracking service
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center">
              <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 dark:text-red-100 mb-1">
                Pricing Calculator Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                Something went wrong while calculating pricing. Please try again.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={this.resetError}
                  className="bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700"
                >
                  <RefreshCw size={14} />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Validation utilities for pricing data
 */
export const PricingValidation = {
  validatePrice: (price: number): boolean => {
    return price >= 0 && price <= 1000000; // $0 to $10,000 in cents
  },

  validateQuantity: (quantity: number): boolean => {
    return quantity >= 1 && quantity <= 999;
  },

  validateDescription: (description: string): boolean => {
    return description.trim().length >= 3 && description.trim().length <= 500;
  },

  validateEffortLevel: (level: string): boolean => {
    return ['low', 'medium', 'high', 'complex'].includes(level);
  },

  validateCurrency: (currency: string): boolean => {
    return ['USD', 'ILS', 'EUR'].includes(currency);
  },

  getValidationErrors: (data: {
    price?: number;
    quantity?: number;
    description?: string;
    effortLevel?: string;
    currency?: string;
  }): string[] => {
    const errors: string[] = [];

    if (data.price !== undefined && !PricingValidation.validatePrice(data.price)) {
      errors.push('Price must be between $0 and $10,000');
    }

    if (data.quantity !== undefined && !PricingValidation.validateQuantity(data.quantity)) {
      errors.push('Quantity must be between 1 and 999');
    }

    if (data.description && !PricingValidation.validateDescription(data.description)) {
      errors.push('Description must be 3-500 characters');
    }

    if (data.effortLevel && !PricingValidation.validateEffortLevel(data.effortLevel)) {
      errors.push('Invalid effort level');
    }

    if (data.currency && !PricingValidation.validateCurrency(data.currency)) {
      errors.push('Invalid currency');
    }

    return errors;
  },
};
