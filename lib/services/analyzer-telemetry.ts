import { logWarn } from '@/lib/error-handler';

export type AnalyzerServiceName =
  | 'puppeteer'
  | 'pagespeed'
  | 'competitor'
  | 'ai'
  | 'cache'
  | 'benchmark';

export function recordAnalyzerServiceFailure(
  serviceName: AnalyzerServiceName,
  error: unknown,
  gracefulDegradation = true
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);

  logWarn('Analyzer sub-service failed', {
    service_name: serviceName,
    error_message: errorMessage,
    graceful_degradation: gracefulDegradation,
  });
}
