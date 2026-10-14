import { z } from 'zod';
import { normalizeProspectStoreUrl } from '@/lib/domain/prospects';
import { analyzeStoreRequestSchema } from '@/lib/validation';

export const storeReviewFocusSchema = z.enum(['conversion', 'speed', 'seo', 'trust', 'checkout']);

export const storeReviewRequestSchema = z.object({
  storeUrl: z.string().trim().min(4).max(2048),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  locale: z.enum(['en', 'he']).default('en'),
  focus: storeReviewFocusSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  marketingOptIn: z.boolean().default(false),
  attribution: analyzeStoreRequestSchema.shape.attribution,
  captchaToken: z.string().max(4096).optional(),
  submissionId: z.string().uuid(),
  website: z.string().max(0).optional(),
}).strict();

export type StoreReviewRequestInput = z.infer<typeof storeReviewRequestSchema>;
export type StoreReviewFocus = z.infer<typeof storeReviewFocusSchema>;
export type StoreReviewStatus = 'requested' | 'accepted' | 'in_review' | 'delivered' | 'declined';

export function normalizeReviewStore(value: string) {
  return normalizeProspectStoreUrl(value);
}

export const storeReviewFindingSchema = z.object({
  id: z.string().uuid(),
  area: z.enum(['ux','product_page','mobile','seo','speed','checkout','trust','other']),
  title: z.string().trim().min(5).max(160),
  observedUrl: z.string().url().max(1024),
  observation: z.string().trim().min(10).max(1500),
  whyItMatters: z.string().trim().min(10).max(1000),
  recommendedAction: z.string().trim().min(10).max(1500),
  priority: z.enum(['high','medium','low']),
  confidence: z.enum(['verified','estimated','needs_access']),
}).strict();

export const storeReviewWorkUpdateSchema = z.object({
  status: z.enum(['accepted','in_review','delivered','declined']).optional(),
  qualified: z.boolean().optional(),
  summary: z.string().trim().max(3000).optional(),
  findings: z.array(storeReviewFindingSchema).max(5).optional(),
  nextAction: z.string().trim().max(300).optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'Empty update');

export function canMoveReviewStatus(previous: StoreReviewStatus, next: StoreReviewStatus) {
  const transitions: Record<StoreReviewStatus, StoreReviewStatus[]> = {
    requested: ['accepted','declined'],
    accepted: ['in_review','declined'],
    in_review: ['delivered','declined'],
    delivered: [],
    declined: [],
  };
  return transitions[previous].includes(next);
}
