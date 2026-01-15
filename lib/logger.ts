/**
 * Client-side logger that respects environment settings
 * In production, only errors are logged. In development, all levels are logged.
 */

export interface LogContext {
  [key: string]: unknown;
}

export class Logger {
  private static shouldLog(level: 'error' | 'warn' | 'info' | 'debug'): boolean {
    if (typeof window === 'undefined') return false;

    // In production, only log errors
    if (process.env.NODE_ENV === 'production') {
      return level === 'error';
    }

    // In development, log all levels
    return true;
  }

  static error(message: string, error?: unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const logData = {
      message,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    };

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
      console.error(JSON.stringify(logData));
    } else {
      console.error(message, error, context);
    }
  }

  static warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;

    const logData = {
      message,
      context,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, only log warnings that are critical
      console.warn(JSON.stringify(logData));
    } else {
      console.warn(message, context);
    }
  }

  static info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;

    if (process.env.NODE_ENV === 'production') {
      // Don't log info in production
      return;
    } else {
      console.info(message, context);
    }
  }

  /**
   * Debug level logging - only logs in development
   * Use for temporary debugging that should be cleaned up before production
   */
  static debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;

    if (process.env.NODE_ENV === 'production') {
      // Never log debug in production
      return;
    }

    // Use console.debug with a prefix for easy filtering
    console.debug(`[DEBUG] ${message}`, context);
  }
}

// Convenience exports
export const logError = Logger.error.bind(Logger);
export const logWarn = Logger.warn.bind(Logger);
export const logInfo = Logger.info.bind(Logger);
export const logDebug = Logger.debug.bind(Logger);
