import type { Currency } from '@/lib/types/portal';

/**
 * A client's configured currency is authoritative for NEW quote drafts.
 * Old documents keep their stored currency; this does not convert money.
 */
export function validateNewQuoteCurrency(configured: unknown, requested: Currency): void {
  if (!['ILS', 'USD', 'EUR'].includes(requested)) {
    throw new Error('Invalid quote currency');
  }
  if (configured === undefined || configured === null || configured === '') {
    // Legacy clients with no configured currency retain their existing workflow.
    return;
  }
  if (!['ILS', 'USD', 'EUR'].includes(String(configured))) {
    throw new Error('Unsupported client currency; update the client profile first');
  }
  if (configured !== requested) {
    throw new Error('Quote currency must match the client currency; change it in the client profile first');
  }
}
