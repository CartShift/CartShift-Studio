/**
 * Standardized Error Handling Utilities
 *
 * Provides user-friendly error messages for various error types,
 * with actionable recovery suggestions and severity levels.
 */

import { FirebaseError } from 'firebase/app';

export type ErrorSeverity = 'low' | 'medium' | 'high';

export interface ErrorDetails {
  /** Human-readable error title */
  title: string;
  /** Descriptive error message */
  message: string;
  /** Optional action the user can take */
  action?: string;
  /** Severity level for UI styling */
  severity: ErrorSeverity;
  /** Whether the error is retryable */
  retryable: boolean;
}

/**
 * Maps a Firebase error code to user-friendly error details
 */
function getFirebaseErrorDetails(error: FirebaseError): ErrorDetails {
  switch (error.code) {
    // Authentication errors
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return {
        title: 'Invalid Credentials',
        message: 'The email or password you entered is incorrect.',
        action: 'Check your credentials and try again',
        severity: 'medium',
        retryable: true,
      };

    case 'auth/email-already-in-use':
      return {
        title: 'Email Already Registered',
        message: 'An account with this email already exists.',
        action: 'Sign in instead',
        severity: 'low',
        retryable: false,
      };

    case 'auth/weak-password':
      return {
        title: 'Weak Password',
        message: 'Please choose a stronger password.',
        action: 'Use at least 8 characters with numbers and symbols',
        severity: 'low',
        retryable: true,
      };

    case 'auth/too-many-requests':
      return {
        title: 'Too Many Attempts',
        message: 'You have made too many attempts. Please wait a few minutes.',
        action: 'Wait and try again later',
        severity: 'medium',
        retryable: true,
      };

    case 'auth/popup-closed-by-user':
      return {
        title: 'Sign-in Cancelled',
        message: 'The sign-in popup was closed before completing.',
        action: 'Try signing in again',
        severity: 'low',
        retryable: true,
      };

    // Firestore/Permission errors
    case 'permission-denied':
    case 'PERMISSION_DENIED':
      return {
        title: 'Access Denied',
        message: "You don't have permission to perform this action.",
        action: 'Contact your administrator',
        severity: 'high',
        retryable: false,
      };

    case 'not-found':
    case 'NOT_FOUND':
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        severity: 'medium',
        retryable: false,
      };

    case 'already-exists':
    case 'ALREADY_EXISTS':
      return {
        title: 'Already Exists',
        message: 'This item already exists. Please use a different value.',
        severity: 'low',
        retryable: false,
      };

    case 'invalid-argument':
    case 'INVALID_ARGUMENT':
      return {
        title: 'Invalid Input',
        message: 'Please check your input and try again.',
        severity: 'low',
        retryable: true,
      };

    case 'resource-exhausted':
    case 'RESOURCE_EXHAUSTED':
      return {
        title: 'Limit Reached',
        message: 'You have reached the maximum limit for this operation.',
        action: 'Upgrade your plan or wait',
        severity: 'medium',
        retryable: false,
      };

    case 'failed-precondition':
    case 'FAILED_PRECONDITION':
      return {
        title: 'Action Not Allowed',
        message: 'This action cannot be performed in the current state.',
        severity: 'medium',
        retryable: false,
      };

    case 'aborted':
    case 'ABORTED':
      return {
        title: 'Operation Aborted',
        message: 'The operation was cancelled. Please try again.',
        severity: 'medium',
        retryable: true,
      };

    // Network errors
    case 'unavailable':
    case 'UNAVAILABLE':
    case 'network-request-failed':
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: 'Check your connection and try again',
        severity: 'medium',
        retryable: true,
      };

    case 'deadline-exceeded':
    case 'DEADLINE_EXCEEDED':
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete.',
        action: 'Try again',
        severity: 'medium',
        retryable: true,
      };

    // Storage errors
    case 'storage/unauthorized':
      return {
        title: 'Upload Not Allowed',
        message: "You don't have permission to upload this file.",
        severity: 'high',
        retryable: false,
      };

    case 'storage/canceled':
      return {
        title: 'Upload Cancelled',
        message: 'The file upload was cancelled.',
        severity: 'low',
        retryable: true,
      };

    case 'storage/object-not-found':
      return {
        title: 'File Not Found',
        message: 'The requested file could not be found.',
        severity: 'medium',
        retryable: false,
      };

    case 'storage/quota-exceeded':
      return {
        title: 'Storage Full',
        message: 'Your storage quota has been exceeded.',
        action: 'Free up space or upgrade your plan',
        severity: 'high',
        retryable: false,
      };

    default:
      return {
        title: 'Error',
        message: error.message || 'An unexpected error occurred.',
        severity: 'medium',
        retryable: true,
      };
  }
}

/**
 * Checks if an error is a network-related error
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('offline')
    );
  }
  return false;
}

/**
 * Parses any error type into standardized ErrorDetails
 *
 * @param error - Any error type (Firebase, Error, string, unknown)
 * @returns Standardized error details for display
 */
export function getErrorMessage(error: unknown): ErrorDetails {
  // Firebase errors
  if (error instanceof FirebaseError) {
    return getFirebaseErrorDetails(error);
  }

  // Standard Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (isNetworkError(error)) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: 'Check your connection and try again',
        severity: 'medium',
        retryable: true,
      };
    }

    // Check for known error patterns
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please sign in again.',
        action: 'Sign in',
        severity: 'medium',
        retryable: false,
      };
    }

    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return {
        title: 'Access Denied',
        message: "You don't have permission to access this resource.",
        severity: 'high',
        retryable: false,
      };
    }

    if (error.message.includes('not found') || error.message.includes('404')) {
      return {
        title: 'Not Found',
        message: 'The requested resource could not be found.',
        severity: 'medium',
        retryable: false,
      };
    }

    if (error.message.includes('server error') || error.message.includes('500')) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. Please try again later.',
        action: 'Try again later',
        severity: 'high',
        retryable: true,
      };
    }

    // Generic error with message
    return {
      title: 'Error',
      message: error.message,
      severity: 'medium',
      retryable: true,
    };
  }

  // String errors
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      severity: 'medium',
      retryable: true,
    };
  }

  // Unknown errors
  return {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again later.',
    action: 'Refresh the page',
    severity: 'high',
    retryable: true,
  };
}

/**
 * Gets a simple error message string for quick display
 *
 * @param error - Any error type
 * @returns A simple string message
 */
export function getSimpleErrorMessage(error: unknown): string {
  const details = getErrorMessage(error);
  return details.message;
}

/**
 * Determines if an error should trigger a retry
 *
 * @param error - Any error type
 * @returns Whether the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return getErrorMessage(error).retryable;
}
