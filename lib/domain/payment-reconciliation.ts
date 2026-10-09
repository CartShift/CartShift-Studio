import type { RequestPaymentRecordStatus } from '@/lib/types/portal';

export type IncomingPaymentEvent = 'paid' | 'failed' | 'refunded';

/**
 * Keep recorded money monotonic under delayed/repeated provider callbacks.
 * A refund is terminal; "capture denied" never cancels an already paid capture.
 * A previously failed payment can still succeed when PayPal later confirms it.
 */
export function shouldApplyPaymentEvent(
  current: RequestPaymentRecordStatus,
  next: IncomingPaymentEvent,
): boolean {
  if (current === next) return false;
  if (current === 'refunded') return false;
  if (current === 'paid' && next === 'failed') return false;
  if (current === 'canceled' && next === 'failed') return false;
  return true;
}
