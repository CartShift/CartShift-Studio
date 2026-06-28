import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  interest: z.string().optional(),
  message: z.string().max(5000, 'Message must be less than 5000 characters').optional(),
  company: z.string().max(200, 'Company name must be less than 200 characters').optional(),
  projectType: z.string().optional(),
  locale: z.enum(['en', 'he']).optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export function validateContactForm(
  data: unknown
): { success: true; data: ContactFormData } | { success: false; errors: z.ZodError } {
  const result = contactFormSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

export const newsletterSubscriptionSchema = z.object({
  email: z.string().email('Invalid email address'),
  locale: z.enum(['en', 'he']).optional(),
  source: z.string().optional(),
});

export type NewsletterSubscriptionData = z.infer<typeof newsletterSubscriptionSchema>;

export function validateNewsletterSubscription(
  data: unknown
): { success: true; data: NewsletterSubscriptionData } | { success: false; errors: z.ZodError } {
  const result = newsletterSubscriptionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export const analyzeStoreRequestSchema = z.object({
  storeUrl: z.string().min(1, 'Store URL is required').max(2048, 'Store URL is too long'),
  email: z.string().email('Invalid email address').max(320, 'Email is too long'),
  subscribeNewsletter: z.boolean().optional().default(false),
  locale: z.enum(['en', 'he']).optional().default('en'),
  captchaToken: z.string().max(4096).optional(),
  intent: z.enum(['conversion', 'speed', 'seo', 'trust', 'checkout']).optional(),
  attribution: z
    .object({
      firstTouch: z.object({
        landingPath: z.string().max(500),
        referrer: z.string().max(500).optional(),
        utmSource: z.string().max(160).optional(),
        utmMedium: z.string().max(160).optional(),
        utmCampaign: z.string().max(160).optional(),
        utmContent: z.string().max(160).optional(),
        utmTerm: z.string().max(160).optional(),
        referralCode: z.string().max(160).optional(),
        partnerCode: z.string().max(160).optional(),
        intent: z.enum(['conversion', 'speed', 'seo', 'trust', 'checkout']).optional(),
        capturedAt: z.string().datetime(),
      }),
      lastTouch: z.object({
        landingPath: z.string().max(500),
        referrer: z.string().max(500).optional(),
        utmSource: z.string().max(160).optional(),
        utmMedium: z.string().max(160).optional(),
        utmCampaign: z.string().max(160).optional(),
        utmContent: z.string().max(160).optional(),
        utmTerm: z.string().max(160).optional(),
        referralCode: z.string().max(160).optional(),
        partnerCode: z.string().max(160).optional(),
        intent: z.enum(['conversion', 'speed', 'seo', 'trust', 'checkout']).optional(),
        capturedAt: z.string().datetime(),
      }),
    })
    .optional(),
});

export type AnalyzeStoreRequestData = z.infer<typeof analyzeStoreRequestSchema>;

const optionalQualifier = z.string().trim().max(240).optional();
export const humanReviewRequestSchema = z.object({
  email: z.string().email().max(320),
  storeUrl: z.string().url().max(2048),
  locale: z.enum(['en', 'he']).default('en'),
  platform: optionalQualifier,
  primaryGoal: optionalQualifier,
  monthlyTraffic: optionalQualifier,
  monthlyRevenue: optionalQualifier,
  biggestConcern: z.string().trim().max(1000).optional(),
  primaryIssue: z.enum(['speed', 'seo', 'trust', 'product_page', 'checkout', 'general_conversion']),
  intent: z.enum(['conversion', 'speed', 'seo', 'trust', 'checkout']).optional(),
  overallScore: z.number().min(0).max(100).optional(),
  anonymousInsightConsent: z.boolean().default(false),
  namedStoreConsent: z.boolean().default(false),
  consentVersion: z.literal('2026-06-28'),
  attribution: analyzeStoreRequestSchema.shape.attribution,
  website: z.string().max(0).optional(),
});

export type HumanReviewRequestData = z.infer<typeof humanReviewRequestSchema>;

export function validateAnalyzeStoreRequest(
  data: unknown
): { success: true; data: AnalyzeStoreRequestData } | { success: false; errors: z.ZodError } {
  const result = analyzeStoreRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
