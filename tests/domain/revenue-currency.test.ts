import { describe, expect, it } from 'vitest';
import { recognizedCurrency, reportingCurrency, revenueByCurrency } from '@/lib/domain/revenue-currency';

describe('currency-safe financial reporting', () => {
  it('refuses to guess unknown or unsupported money denominations', () => {
    expect(recognizedCurrency('ILS')).toBe('ILS');
    expect(recognizedCurrency('GBP')).toBeNull();
    expect(recognizedCurrency(undefined)).toBeNull();
  });
  it('selects a deterministic reporting currency without using raw amount sizes', () => {
    const rows = [{ currency: 'ILS', amount: 1000000 },
      { currency: 'USD', amount: 400 }, { currency: 'USD', amount: 500 }];
    expect(reportingCurrency(rows)).toBe('USD');
    expect(reportingCurrency([], 'EUR')).toBe('EUR');
  });
  it('never sums recognized revenue in different currencies or unknown currencies', () => {
    const rows = [{ currency: 'ILS', revenue: 20000 },
      { currency: 'USD', revenue: 10000 },
      { currency: 'ILS', revenue: 7000 },
      { revenue: 9000 }];
    expect(revenueByCurrency(rows, row => row.revenue)).toEqual({
      amounts: { ILS: 27000, USD: 10000, EUR: 0 },
      containsUnknown: true,
    });
  });
});
