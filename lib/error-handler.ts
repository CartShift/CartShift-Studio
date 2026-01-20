type LogLevel = 'error' | 'warn' | 'info' | 'debug';

function shouldLog(level: LogLevel): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level === 'error' || level === 'warn';
  }
  return true;
}

export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void {
  if (!shouldLog('error')) return;

  const errorInfo = {
    message,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    context,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'production') {
    console.error(JSON.stringify(errorInfo));
  } else {
    console.error(message, error, context);
  }
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('warn')) return;

  if (process.env.NODE_ENV === 'production') {
    console.warn(JSON.stringify({ message, context, timestamp: new Date().toISOString() }));
  } else {
    console.warn(message, context);
  }
}

export function logInfo(message: string, context?: Record<string, unknown>): void {
  if (!shouldLog('info')) return;
  console.log(message, context);
}

export function createErrorResponse(message: string, status: number = 500, details?: unknown) {
  return {
    error: message,
    status,
    ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
  };
}
