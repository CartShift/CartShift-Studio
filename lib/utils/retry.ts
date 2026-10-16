/** Only retry failures for which another attempt may succeed. */
export function isTransientFirebaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = String(error.code).replace(/^firestore\//, '');
  return code === 'unavailable' || code === 'deadline-exceeded' || code === 'aborted' ||
    code === 'resource-exhausted';
}

/**
 * Configuration options for the retry logic
 */
interface RetryOptions {
  /** Maximum number of attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms (default: 1000) */
  initialDelay?: number;
  /** Factor to multiply delay by after each failure (default: 2) */
  backoffFactor?: number;
  /** Optional conditional function to determine if we should retry based on the error */
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Wraps a promise-returning function with retry logic including exponential backoff
 *
 * @param fn The async function to execute
 * @param options Configuration options
 * @returns The result of the function call
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffFactor = 2,
    shouldRetry = isTransientFirebaseError,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If we've reached max attempts or the error isn't retriable, throw immediately
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Wait only for transient failures; never replay validation/auth errors.
      console.warn(`[Retry] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw lastError;
}
