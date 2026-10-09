import { describe, expect, it } from 'vitest';
import { shouldApplyPaymentEvent } from '@/lib/domain/payment-reconciliation';

describe('reconciliation against webhook replay', () => {
  it('does not replay capture, failure or refund of an existing state', () => {
    expect(shouldApplyPaymentEvent('paid', 'paid')).toBe(false);
    expect(shouldApplyPaymentEvent('failed', 'failed')).toBe(false);
    expect(shouldApplyPaymentEvent('refunded', 'refunded')).toBe(false);
  });

  it('prevents stale capture or denied events from reopening a refund', () => {
    expect(shouldApplyPaymentEvent('refunded', 'paid')).toBe(false);
    expect(shouldApplyPaymentEvent('refunded', 'failed')).toBe(false);
    expect(shouldApplyPaymentEvent('paid', 'failed')).toBe(false);
  });

  it('accepts a valid capture and subsequent refund, including recovery after failure', () => {
    expect(shouldApplyPaymentEvent('pending', 'paid')).toBe(true);
    expect(shouldApplyPaymentEvent('failed', 'paid')).toBe(true);
    expect(shouldApplyPaymentEvent('paid', 'refunded')).toBe(true);
  });
});
