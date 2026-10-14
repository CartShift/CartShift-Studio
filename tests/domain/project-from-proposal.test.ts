import { describe, expect, it } from 'vitest';
import { approvedProjectScope, projectIdForProposal, projectSummaryFromProposal } from '@/lib/domain/project-from-proposal';
import { emptyProposalContent } from '@/lib/domain/proposal-content';

describe('accepted proposal project contract', () => {
  it('uses a stable and safe id even when a hook retries', () => {
    expect(projectIdForProposal('quote-abc')).toBe('project_from_quote-abc');
    expect(projectIdForProposal('quote-abc')).toBe(projectIdForProposal('quote-abc'));
    expect(() => projectIdForProposal('../escape')).toThrow('INVALID_PROPOSAL_ID');
  });
  it('copies hourly cap in minor currency units, not payment state', () => {
    const content = emptyProposalContent();
    content.pricing = { mode: 'hourly_capped', hourlyRateMinor: 25000, hoursMin: 12, hoursMax: 16, depositPercent: 50 };
    expect(approvedProjectScope(content, 'ILS')).toEqual({
      minHours: 12, maxHours: 16, rateCents: 25000, currency: 'ILS',
    });
  });
  it('does not invent an hourly budget for fixed offers', () => {
    expect(approvedProjectScope(emptyProposalContent(), 'EUR')).toEqual({
      minHours: 0, maxHours: 0, rateCents: 0, currency: 'EUR',
    });
  });
  it('copies only customer-facing objective into client-visible project summary', () => {
    const content = emptyProposalContent();
    content.objective = 'Approved scope';
    const proposal = { description: 'Alternative', proposalContent: content, agencyNotes: 'PRIVATE NOTES' };
    expect(projectSummaryFromProposal(proposal)).toBe('Approved scope');
  });
});
