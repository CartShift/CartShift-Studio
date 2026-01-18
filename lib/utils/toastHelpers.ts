/**
 * Toast Helper Utilities
 *
 * Provides standardized toast notifications that integrate with
 * the error handling system for consistent user feedback.
 */

import { toast } from 'sonner';
import { getErrorMessage } from './errorHandling';

/**
 * Display an error toast with standardized formatting
 *
 * @param error - Any error type (will be parsed for user-friendly message)
 * @param options - Optional override for title or action handler
 */
export function showError(
  error: unknown,
  options?: {
    title?: string;
    onAction?: () => void;
  }
): void {
  const details = getErrorMessage(error);

  toast.error(options?.title ?? details.title, {
    description: details.message,
    action: details.action
      ? {
          label: details.action,
          onClick: options?.onAction ?? (() => {}),
        }
      : undefined,
    duration: details.severity === 'high' ? 8000 : 5000,
  });
}

/**
 * Display a success toast
 *
 * @param message - Success message to display
 * @param options - Optional title override
 */
export function showSuccess(
  message: string,
  options?: {
    title?: string;
    description?: string;
    duration?: number;
  }
): void {
  toast.success(options?.title ?? 'Success', {
    description: options?.description ?? message,
    duration: options?.duration ?? 4000,
  });
}

/**
 * Display a warning toast
 *
 * @param message - Warning message
 * @param options - Optional configuration
 */
export function showWarning(
  message: string,
  options?: {
    title?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }
): void {
  toast.warning(options?.title ?? 'Warning', {
    description: message,
    action: options?.action,
    duration: options?.duration ?? 5000,
  });
}

/**
 * Display an info toast
 *
 * @param message - Info message
 * @param options - Optional configuration
 */
export function showInfo(
  message: string,
  options?: {
    title?: string;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }
): void {
  toast.info(options?.title ?? 'Info', {
    description: message,
    action: options?.action,
    duration: options?.duration ?? 4000,
  });
}

/**
 * Display a loading toast that can be updated
 *
 * @param message - Initial loading message
 * @returns Toast ID for updating/dismissing
 */
export function showLoading(message: string): string | number {
  return toast.loading(message);
}

/**
 * Dismiss a specific toast
 *
 * @param toastId - ID returned from showLoading
 */
export function dismissToast(toastId: string | number): void {
  toast.dismiss(toastId);
}

/**
 * Update a loading toast to success
 *
 * @param toastId - ID of toast to update
 * @param message - Success message
 */
export function updateToastSuccess(toastId: string | number, message: string): void {
  toast.success(message, { id: toastId });
}

/**
 * Update a loading toast to error
 *
 * @param toastId - ID of toast to update
 * @param error - Error to display
 */
export function updateToastError(toastId: string | number, error: unknown): void {
  const details = getErrorMessage(error);
  toast.error(details.title, {
    id: toastId,
    description: details.message,
  });
}

/**
 * Helper to wrap async operations with loading/success/error toasts
 *
 * @param promise - Promise to execute
 * @param messages - Loading, success, and error messages
 * @returns The resolved value of the promise
 */
export async function withToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error?: string;
  }
): Promise<T> {
  const toastId = showLoading(messages.loading);

  try {
    const result = await promise;
    updateToastSuccess(toastId, messages.success);
    return result;
  } catch (error) {
    if (messages.error) {
      toast.error(messages.error, { id: toastId });
    } else {
      updateToastError(toastId, error);
    }
    throw error;
  }
}

/**
 * Show an error toast with a retry action
 *
 * @param error - The error that occurred
 * @param onRetry - Callback to retry the operation
 */
export function showErrorWithRetry(error: unknown, onRetry: () => void): void {
  const details = getErrorMessage(error);

  if (details.retryable) {
    toast.error(details.title, {
      description: details.message,
      action: {
        label: 'Try Again',
        onClick: onRetry,
      },
      duration: 8000,
    });
  } else {
    showError(error);
  }
}
