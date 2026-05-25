import { logError, logWarn } from '@/lib/error-handler';
import { env } from '@/lib/env';
import { buildFirebaseFunctionUrl } from '@/lib/services/firebase';
import type { AnalysisResult } from '@/lib/types/analyzer';

const REPORT_DELIVERY_TIMEOUT_MS = 12_000;

export type ReportDeliveryStatus = 'sent' | 'failed' | 'unconfigured';

export async function deliverStoreAnalysisReport(params: {
  email: string;
  storeUrl: string;
  locale: string;
  results: AnalysisResult;
  subscribeNewsletter: boolean;
}): Promise<ReportDeliveryStatus> {
  const reportUrl = buildFirebaseFunctionUrl(
    env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL,
    'sendStoreAnalysisReport'
  );

  if (!reportUrl) {
    logWarn('Store analysis report delivery skipped: function URL not configured');
    return 'unconfigured';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REPORT_DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(reportUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      logError(
        'Store analysis report delivery failed',
        new Error(errorBody || `HTTP ${response.status}`),
        { storeUrl: params.storeUrl, status: response.status }
      );
      return 'failed';
    }

    return 'sent';
  } catch (error) {
    logError('Store analysis report delivery error', error, { storeUrl: params.storeUrl });
    return 'failed';
  } finally {
    clearTimeout(timeoutId);
  }
}
