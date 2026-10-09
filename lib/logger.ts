/**
 * Client-side logger that respects environment settings
 * In production, only errors are logged. In development, all levels are logged.
 */
import { createSafeErrorEvent } from '@/lib/observability/safe-error-event';

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

    if (process.env.NODE_ENV === 'production') {
      // No stack, URL, user agent, context, raw exception or arbitrary message.
      const payload = createSafeErrorEvent(error);
      console.error('[portal-client-error]', JSON.stringify(payload));
      try {
        const encoded = JSON.stringify(payload);
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon('/api/portal/telemetry', new Blob([encoded], { type: 'application/json' }));
        } else {
          void fetch('/api/portal/telemetry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: encoded,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Error reporting must never crash the original user action.
      }
      return;
    }
    console.error(message, error, context);
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
