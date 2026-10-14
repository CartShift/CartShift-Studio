import type { ProjectScope } from '@/lib/types/project';
import type { ProposalContent } from '@/lib/domain/proposal-content';

/** Stable identity means retries cannot create another project for one proposal. */
export function projectIdForProposal(proposalId: string): string {
  if (!/^[A-Za-z0-9_-]{1,120}$/.test(proposalId)) throw new Error('INVALID_PROPOSAL_ID');
  return 'project_from_' + proposalId;
}

export function approvedProjectScope(
  content: ProposalContent | null | undefined,
  currency: 'ILS' | 'USD' | 'EUR',
): ProjectScope {
  const pricing = content?.pricing;
  if (!pricing || !['hourly_estimate', 'hourly_capped'].includes(pricing.mode)) {
    return { minHours: 0, maxHours: 0, rateCents: 0, currency };
  }
  const minHours = Number(pricing.hoursMin ?? 0);
  const maxHours = Number(pricing.hoursMax ?? 0);
  const rateCents = Number(pricing.hourlyRateMinor ?? 0);
  if (![minHours, maxHours, rateCents].every(Number.isFinite) ||
      minHours < 0 || maxHours < minHours || rateCents < 0) {
    throw new Error('INVALID_PROJECT_SCOPE');
  }
  return { minHours, maxHours, rateCents, currency };
}

/** No internal notes, private billing records, or unpublished content. */
export function projectSummaryFromProposal(
  proposal: { description?: string | null; proposalContent?: ProposalContent | null },
): string {
  return (proposal.proposalContent?.objective?.trim() ||
    proposal.description?.trim() || '').slice(0, 4000);
}
