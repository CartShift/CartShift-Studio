import type { Currency } from '@/lib/types/portal';

/** An unrecognized historical currency is not safe to interpret as ILS or USD. */
export function recognizedCurrency(value: unknown): Currency | null {
  return value === 'ILS' || value === 'USD' || value === 'EUR' ? value : null;
}

export function reportingCurrency<T extends { currency?: unknown }>(
  rows: readonly T[], fallback: Currency = 'ILS'
): Currency {
  const counts: Record<Currency, number> = { ILS: 0, USD: 0, EUR: 0 };
  for (const row of rows) {
    const currency = recognizedCurrency(row.currency);
    if (currency) counts[currency]++;
  }
  const ranked = (Object.entries(counts) as Array<[Currency, number]>)
    .sort((a, b) => b[1] - a[1] || (a[0] === fallback ? -1 : b[0] === fallback ? 1 : 0));
  return ranked[0]?.[1] ? ranked[0][0] : fallback;
}

export function revenueByCurrency<T extends { currency?: unknown }>(
  rows: readonly T[], getValue: (row: T) => number
) {
  const amounts: Record<Currency, number> = { ILS: 0, USD: 0, EUR: 0 };
  let containsUnknown = false;
  for (const row of rows) {
    const value = getValue(row);
    if (!(value > 0)) continue;
    const currency = recognizedCurrency(row.currency);
    if (currency) amounts[currency] += value;
    else containsUnknown = true;
  }
  return { amounts, containsUnknown };
}
