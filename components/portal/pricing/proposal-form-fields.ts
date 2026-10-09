import { z } from 'zod';

/**
 * Reuse the contract for fields whose meaning is identical on both proposal
 * creation and editing. Keep mode-specific constraints near their call sites
 * (e.g. line item identity and client email validation).
 */
export function sharedProposalFields() {
  return {
    description: z.string().optional(),
    currency: z.enum(['USD', 'ILS', 'EUR']),
    validUntil: z.string().optional(),
    timeframe: z.string().trim().min(1),
    workDeadline: z.string().optional(),
    assignedTo: z.string().trim().min(1),
    clientName: z.string().optional(),
    agencyNotes: z.string().optional(),
    includeTax: z.boolean(),
    terms: z.string().min(1),
    paymentRequired: z.boolean(),
    depositAmount: z.number().min(0),
  };
}

export function sharedProposalLineItemFields(messages: {
  descriptionRequired: string;
  quantityMinimum: string;
  priceMinimum: string;
}) {
  return {
    description: z.string().min(1, messages.descriptionRequired),
    quantity: z.number().min(1, messages.quantityMinimum),
    unitPrice: z.number().min(0, messages.priceMinimum),
    notes: z.string().optional(),
    requestId: z.string().optional(),
    pricingType: z.enum(['fixed', 'hourly', 'estimate']).optional(),
  };
}
