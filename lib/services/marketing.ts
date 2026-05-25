import { z } from 'zod';
import { env } from '@/lib/env';
import { logError } from '@/lib/error-handler';
import { sanitizeString } from '@/lib/sanitize';
import { buildFirebaseFunctionUrl } from '@/lib/services/firebase';

const localeSchema = z.enum(['en', 'he']).default('en');

const marketingCaptureSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z
    .enum([
      'store_analyzer',
      'newsletter',
      'newsletter_footer',
      'contact_form',
      'blog_cta',
      'service_page_cta',
      'website',
    ])
    .default('website'),
  locale: localeSchema.optional(),
  name: z.string().max(120).optional(),
  company: z.string().max(200).optional(),
  interest: z.string().max(120).optional(),
  projectType: z.string().max(120).optional(),
  message: z.string().max(5000).optional(),
  storeUrl: z.string().max(2048).optional(),
  platform: z.string().max(80).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  subscribeNewsletter: z.boolean().optional(),
  consent: z.boolean().optional(),
  skipWelcome: z.boolean().optional(),
  metadata: z.record(z.string(), z.string().or(z.number()).or(z.boolean()).nullable()).optional(),
});

export type MarketingCaptureData = z.infer<typeof marketingCaptureSchema>;

export type MarketingScoreBand = 'critical' | 'warning' | 'good' | 'excellent' | 'unknown';

export function normalizeMarketingEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getMarketingScoreBand(score?: number): MarketingScoreBand {
  if (typeof score !== 'number') return 'unknown';
  if (score < 40) return 'critical';
  if (score < 70) return 'warning';
  if (score < 85) return 'good';
  return 'excellent';
}

export function getMarketingLeadScoreDelta(
  data: Pick<MarketingCaptureData, 'source' | 'overallScore'>
) {
  let score = 0;

  if (data.source === 'contact_form') score += 60;
  if (data.source === 'store_analyzer') score += 20;
  if (data.source === 'newsletter' || data.source === 'newsletter_footer') score += 5;
  if (data.source === 'blog_cta' || data.source === 'service_page_cta') score += 10;

  if (typeof data.overallScore === 'number') {
    if (data.overallScore < 50) score += 15;
    else if (data.overallScore < 70) score += 8;
  }

  return score;
}

function getMarketingFunctionUrl(functionName: string) {
  if (functionName.startsWith('marketing')) {
    return `https://us-central1-${env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net/${functionName}`;
  }

  return buildFirebaseFunctionUrl(env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL, functionName);
}

export async function captureMarketingLead(
  data: unknown
): Promise<{ success: true; leadId?: string } | { success: false; error: string; status: number }> {
  const validation = marketingCaptureSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid marketing lead data',
      status: 400,
    };
  }

  const payload: MarketingCaptureData = {
    ...validation.data,
    email: normalizeMarketingEmail(validation.data.email),
    locale: validation.data.locale || 'en',
    name: validation.data.name ? sanitizeString(validation.data.name) : undefined,
    company: validation.data.company ? sanitizeString(validation.data.company) : undefined,
    interest: validation.data.interest ? sanitizeString(validation.data.interest) : undefined,
    projectType: validation.data.projectType
      ? sanitizeString(validation.data.projectType)
      : undefined,
    message: validation.data.message ? sanitizeString(validation.data.message) : undefined,
    storeUrl: validation.data.storeUrl ? sanitizeString(validation.data.storeUrl) : undefined,
    platform: validation.data.platform ? sanitizeString(validation.data.platform) : undefined,
  };

  const functionUrl = getMarketingFunctionUrl('marketingCapture');
  if (!functionUrl) {
    logError('marketingCapture function URL could not be built', new Error('Invalid function URL'));
    return { success: false, error: 'Configuration error. Please contact support.', status: 500 };
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || `Firebase function returned ${response.status}`);
    }

    return { success: true, leadId: result.leadId };
  } catch (error) {
    logError('Failed to capture marketing lead', error, { source: payload.source });
    return { success: false, error: 'Failed to save marketing lead.', status: 500 };
  }
}

export async function trackMarketingEmailClick(data: {
  leadId: string;
  jobId?: string;
  token: string;
  targetUrl: string;
}) {
  const functionUrl = getMarketingFunctionUrl('marketingTrackClick');
  if (!functionUrl) return { success: false };

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return { success: response.ok };
  } catch (error) {
    logError('Failed to track marketing email click', error, { leadId: data.leadId });
    return { success: false };
  }
}

export async function unsubscribeMarketingLead(data: { leadId: string; token: string }) {
  const functionUrl = getMarketingFunctionUrl('marketingUnsubscribe');
  if (!functionUrl) return { success: false };

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return { success: response.ok };
  } catch (error) {
    logError('Failed to unsubscribe marketing lead', error, { leadId: data.leadId });
    return { success: false };
  }
}

export async function trackMarketingCtaEngagement(data: {
  leadId: string;
  ctaText?: string;
  ctaLocation: string;
  intent?: string;
}) {
  const functionUrl = getMarketingFunctionUrl('marketingTrackEngagement');
  if (!functionUrl) return { success: false };

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return { success: response.ok };
  } catch (error) {
    logError('Failed to track marketing CTA engagement', error, { leadId: data.leadId });
    return { success: false };
  }
}
