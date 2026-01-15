/**
 * Structured Logging Utility
 * Provides consistent, environment-aware logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  requestId?: string;
}

class StructuredLogger {
  private userId: string | null = null;
  private requestId: string | null = null;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  setContext(userId: string | null, requestId: string | null): void {
    this.userId = userId;
    this.requestId = requestId;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      return level === 'error' || level === 'warn';
    }
    return true;
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    error?: unknown,
    context?: Record<string, unknown>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (this.userId) entry.userId = this.userId;
    if (this.requestId) entry.requestId = this.requestId;
    if (context) entry.context = context;

    if (error) {
      if (error instanceof Error) {
        entry.error = {
          name: error.name,
          message: error.message,
          stack: this.isProduction ? undefined : error.stack,
        };
      } else {
        entry.error = {
          name: 'Unknown',
          message: String(error),
        };
      }
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    if (this.isProduction) {
      // JSON output for production logging systems
      console.log(JSON.stringify(entry));
    } else {
      // Formatted output for development
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[entry.level];

      const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? ` | ${entry.error.name}: ${entry.error.message}` : '';

      console.log(
        `${emoji} [${entry.level.toUpperCase()}] ${entry.message}${contextStr}${errorStr}`
      );
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatEntry('debug', message, undefined, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatEntry('info', message, undefined, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.output(this.formatEntry('warn', message, undefined, context));
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    this.output(this.formatEntry('error', message, error, context));
  }
}

// Singleton instance
const logger = new StructuredLogger();

export const log = {
  debug: (message: string, context?: Record<string, unknown>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) => logger.warn(message, context),
  error: (message: string, error?: unknown, context?: Record<string, unknown>) =>
    logger.error(message, error, context),
  setContext: (userId: string | null, requestId: string | null) =>
    logger.setContext(userId, requestId),
};

export default logger;
