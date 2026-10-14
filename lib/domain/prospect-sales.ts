import { z } from 'zod';

export const prospectStageSchema = z.enum([
  'needs_review', 'qualified', 'contact_research', 'contact_ready',
  'in_conversation', 'proposal', 'won', 'lost', 'suppressed',
]);

export const prospectSalesUpdateSchema = z.object({
  stage: prospectStageSchema.optional(),
  owner_uid: z.string().regex(/^[a-zA-Z0-9_-]{6,128}$/).optional(),
  next_action: z.string().trim().max(500).optional(),
  due_date: z.iso.date().optional(),
  note: z.string().trim().min(3).max(2000).optional(),
}).strict().refine(value => Object.values(value).some(item => item !== undefined), 'Empty update');

export const prospectReviewSchema = z.object({
  outreach_eligibility: z.enum([
    'review_required', 'consent_recorded', 'existing_relationship',
    'approved_partner_channel', 'blocked',
  ]),
  evidence_url: z.string().url().max(1024).optional(),
  note: z.string().trim().min(15).max(1000),
}).strict().superRefine((value, ctx) => {
  if (!['review_required', 'blocked'].includes(value.outreach_eligibility) && !value.evidence_url) {
    ctx.addIssue({ code: 'custom', path: ['evidence_url'],
      message: 'Approval requires documented eligibility evidence' });
  }
});

/** Sales managers may link only organizations whose listed website matches the prospect.
 * Owners can review organizations with no website but never override a known mismatch.
 */
export function canLinkProspectToOrganization(
  canonicalDomain: string, organizationWebsite: string | undefined, actorRole: string,
): boolean {
  const website = organizationWebsite?.trim();
  if (!website) return actorRole === 'owner' || actorRole === 'admin';
  try {
    const url = new URL(/^https?:\/\//i.test(website) ? website : 'https://' + website);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    const domain = url.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
    return domain === canonicalDomain;
  } catch {
    return false;
  }
}
