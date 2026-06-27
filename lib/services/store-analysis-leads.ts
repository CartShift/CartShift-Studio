import { logError } from '@/lib/error-handler';
import { CacheService } from '@/lib/services/cache-service';
import { captureMarketingLead, normalizeMarketingEmail } from '@/lib/services/marketing';
import { env } from '@/lib/env';

export type StoreAnalysisLeadStatus = 'captured' | 'deduped' | 'failed' | 'unconfigured';

const LEAD_DEDUPE_TTL_SECONDS = 86_400;

function buildLeadDedupeKey(email: string, storeUrl: string): string {
  const normalizedEmail = normalizeMarketingEmail(email);
  const normalizedUrl = storeUrl.trim().toLowerCase().replace(/\/+$/, '');
  return `store-analysis-lead:${normalizedEmail}:${normalizedUrl}`;
}

function isMarketingCaptureConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

export async function captureStoreAnalysisLead(params: {
  email: string;
  storeUrl: string;
  locale: string;
  platform?: string | null;
  overallScore: number;
  focusArea?: 'performance' | 'seo' | 'accessibility' | 'bestPractices' | 'cart' | 'trust';
  focusScore?: number;
  primaryRecommendation?: string;
  subscribeNewsletter: boolean;
}): Promise<StoreAnalysisLeadStatus> {
  if (!isMarketingCaptureConfigured()) {
    return 'unconfigured';
  }

  const dedupeKey = buildLeadDedupeKey(params.email, params.storeUrl);
  const recentlyCaptured = await CacheService.get<boolean>(dedupeKey);
  if (recentlyCaptured) {
    if (params.subscribeNewsletter) {
      await captureMarketingLead({
        email: params.email,
        storeUrl: params.storeUrl,
        locale: params.locale as 'en' | 'he',
        source: 'store_analyzer',
        platform: params.platform || undefined,
        overallScore: params.overallScore,
        focusArea: params.focusArea,
        focusScore: params.focusScore,
        primaryRecommendation: params.primaryRecommendation,
        subscribeNewsletter: true,
        consent: true,
        skipWelcome: true,
      });
    }
    return 'deduped';
  }

  const result = await captureMarketingLead({
    email: params.email,
    storeUrl: params.storeUrl,
    locale: params.locale as 'en' | 'he',
    source: 'store_analyzer',
    platform: params.platform || undefined,
    overallScore: params.overallScore,
    focusArea: params.focusArea,
    focusScore: params.focusScore,
    primaryRecommendation: params.primaryRecommendation,
    subscribeNewsletter: params.subscribeNewsletter,
    consent: params.subscribeNewsletter,
    skipWelcome: true,
  });

  if (!result.success) {
    logError('Store analysis lead capture failed', new Error(result.error), {
      storeUrl: params.storeUrl,
    });
    return 'failed';
  }

  await CacheService.set(dedupeKey, true, LEAD_DEDUPE_TTL_SECONDS);
  return 'captured';
}
