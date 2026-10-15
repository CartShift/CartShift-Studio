import { z } from 'zod';

/** Human-logged notes and touchpoints; no sending occurs in this domain. */
export const prospectActivitySchema = z.object({
  kind: z.enum(['note','call','email','meeting','social','follow_up','review_request','review_completed']),
  direction: z.enum(['internal','inbound','outbound']).default('internal'),
  outcome: z.enum(['none','attempted','responded','positive','negative','booked']).default('none'),
  note: z.string().trim().min(3).max(1500),
  occurred_at: z.iso.datetime({ offset: true }).optional(),
}).strict().superRefine((value, ctx) => {
  const communication = ['call','email','meeting','social'].includes(value.kind);
  if (!communication && value.direction !== 'internal') {
    ctx.addIssue({ code: 'custom', path: ['direction'], message: 'Internal event cannot be outreach' });
  }
});
export type ProspectActivityInput = z.infer<typeof prospectActivitySchema>;
export function isContactAllowed(value: string): boolean {
  return ['consent_recorded','existing_relationship','approved_partner_channel'].includes(value);
}
/** Historical segmentation is a research hint, not a verification of the store. */
export function inferProspectSegment(note: string, type?: string): 'merchant' | 'agency_partner' | 'unknown' {
  if (type === 'merchant' || type === 'agency_partner') return type;
  if (note.includes('שותף / סוכנות')) return 'agency_partner';
  if (note.includes('בעל חנות')) return 'merchant';
  return 'unknown';
}
