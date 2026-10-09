import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  sharedProposalFields,
  sharedProposalLineItemFields,
} from '@/components/portal/pricing/proposal-form-fields';

const proposal = z.object(sharedProposalFields());
const item = z.object(sharedProposalLineItemFields({
  descriptionRequired: 'required',
  quantityMinimum: 'quantity',
  priceMinimum: 'price',
}));

describe('shared proposal form contract', () => {
  it('keeps monetary values numeric and rejects negative deposits', () => {
    const input = {
      currency: 'ILS',
      timeframe: '2 weeks',
      assignedTo: 'developer-1',
      includeTax: true,
      terms: 'Net 30',
      paymentRequired: true,
      depositAmount: 0,
    };
    expect(proposal.safeParse(input).success).toBe(true);
    expect(proposal.safeParse({ ...input, depositAmount: -1 }).success).toBe(false);
    expect(proposal.safeParse({ ...input, currency: 'GBP' }).success).toBe(false);
  });

  it('validates unit price and quantity without altering line-item IDs', () => {
    const valid = { description: 'Development', quantity: 1, unitPrice: 0 };
    expect(item.safeParse(valid).success).toBe(true);
    expect(item.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
    expect(item.safeParse({ ...valid, unitPrice: -1 }).success).toBe(false);
  });
});
