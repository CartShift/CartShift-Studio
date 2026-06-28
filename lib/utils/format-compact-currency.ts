/** Compact currency display for dashboards and tables (e.g. $1.2K, $3.4M). */
export function formatCompactCurrency(amount: number, currency = 'USD'): string {
  const symbol = currency === 'ILS' ? '₪' : currency === 'EUR' ? '€' : '$';

  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toLocaleString()}`;
}
