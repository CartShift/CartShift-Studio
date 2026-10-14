import { describe, expect, it } from 'vitest';
import { validateNewQuoteCurrency } from '@/lib/domain/client-currency';

describe('client-level currency contracts', () => {
  it.each(['ILS', 'USD', 'EUR'] as const)('accepts configured %s for new quotes', currency => {
    expect(() => validateNewQuoteCurrency(currency, currency)).not.toThrow();
  });
  it('rejects a quote in a denomination other than the client configuration', () => {
    expect(() => validateNewQuoteCurrency('USD', 'ILS')).toThrow('Quote currency must match');
  });
  it('does not invent currencies for legacy clients that have none configured', () => {
    expect(() => validateNewQuoteCurrency(undefined, 'EUR')).not.toThrow();
  });
  it('does not silently accept unknown client currency values', () => {
    expect(() => validateNewQuoteCurrency('GBP', 'USD')).toThrow('Unsupported client currency');
  });
});
