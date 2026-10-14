import { z } from 'zod';

// These are research candidates, never verified consent or permission to market.
export const prospectContactCandidateSchema = z.object({
  prospect_id: z.string().regex(/^prospect_[0-9a-f]{32}$/),
  role: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120).optional(),
  business_email: z.string().trim().email().max(240).optional(),
  source_url: z.string().trim().url().max(1024),
  evidence_excerpt: z.string().trim().min(8).max(400),
}).strict();

export type ProspectContactCandidateInput = z.infer<typeof prospectContactCandidateSchema>;
