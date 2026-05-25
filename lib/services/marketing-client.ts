import { logError } from '@/lib/logger';
import type { MarketingCaptureData } from '@/lib/services/marketing';

export async function captureMarketingLead(data: MarketingCaptureData) {
  try {
    const response = await fetch('/api/marketing/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to capture lead');
    }

    return await response.json();
  } catch (error) {
    logError('Marketing lead capture failed', error);
    throw error;
  }
}
