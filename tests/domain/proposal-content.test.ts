import { describe, expect, it } from 'vitest';
import {
  calculateDeposit,
  canStartProposalWork,
  calculateEstimate,
  emptyProposalContent,
  shopifyProjectTemplate,
  validateProposalContent,
} from '@/lib/domain/proposal-content';

describe('structured work proposals', () => {
  it('loads the Arava-style workflow as an opt-in template', () => {
    const template = shopifyProjectTemplate();
    expect(template.pricing.mode).toBe('hourly_capped');
    expect(template.pricing.hourlyRateMinor).toBe(25_000);
    expect(template.pricing.depositPercent).toBe(50);
    expect(template.requirements.length).toBeGreaterThan(0);
    expect(template.exclusions.length).toBeGreaterThan(0);
    expect(calculateEstimate(template)).toEqual({
      mode: 'hourly_capped',
      minMinor: 300_000,
      maxMinor: 400_000,
    });
  });

  it('supports zero deposits and reliably rounds half of the approved gross amount', () => {
    expect(calculateDeposit(472_000, 50)).toBe(236_000);
    expect(calculateDeposit(47_201, 50)).toBe(23_601);
    expect(calculateDeposit(100_000, 0)).toBe(0);
  });

  it('never turns a fixed quote into an unrequested time estimate', () => {
    expect(calculateEstimate(emptyProposalContent())).toBeNull();
  });

  it('prevents project execution before signature, deposit and mandatory materials', () => {
    const content = shopifyProjectTemplate();
    const quote = {
      publicToken: 'token',
      status: 'ACCEPTED',
      paymentRequired: true,
      depositAmount: 236_000,
      amountPaid: 236_000,
      proposalContent: content,
      proposalRequirementStatuses: Object.fromEntries(
        content.requirements.map(req => [req.id, 'approved' as const])
      ),
    };
    expect(canStartProposalWork(quote)).toBe(true);
    expect(canStartProposalWork({ ...quote, amountPaid: 0 })).toBe(false);
    expect(canStartProposalWork({ ...quote, status: 'QUOTED' })).toBe(false);
    expect(canStartProposalWork({
      ...quote,
      proposalRequirementStatuses: { ...quote.proposalRequirementStatuses, 'store-access': 'pending' },
    })).toBe(false);
    expect(canStartProposalWork({ status: 'NEW' })).toBe(true);
  });

  it('rejects unsafe ranges and inconsistent content', () => {
    const invalid = shopifyProjectTemplate();
    invalid.pricing.hoursMin = 20;
    invalid.pricing.hoursMax = 12;
    expect(() => validateProposalContent(invalid)).toThrow();
    invalid.pricing.hoursMax = 25;
    invalid.pricing.depositPercent = 101;
    expect(() => validateProposalContent(invalid)).toThrow();
    invalid.pricing.depositPercent = 50;
    invalid.scope = [{ id: 'one', title: 'A', description: '' }, { id: 'one', title: 'B', description: '' }];
    expect(() => validateProposalContent(invalid)).toThrow();
  });
});
