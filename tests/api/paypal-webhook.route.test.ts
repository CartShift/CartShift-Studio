import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const payments = vi.hoisted(() => ({
  verify: vi.fn(),
  reconcile: vi.fn(),
}));

vi.mock('@/lib/services/paypal-server', () => ({ verifyPayPalWebhook: payments.verify }));
vi.mock('@/lib/services/proposals-server', () => ({ reconcileProposalPayment: payments.reconcile }));
vi.mock('@/lib/services/proposal-api-utils', () => ({
  mapProposalError: vi.fn(() => new Response(JSON.stringify({ error: 'Payment reconciliation failed' }), { status: 500 })),
}));

import { POST } from '@/app/api/paypal/webhook/route';

function webhook(type: string, resource: Record<string, unknown>, headers?: Record<string, string>) {
  return new NextRequest('https://cartshift.test/api/paypal/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ event_type: type, resource }),
  });
}

describe('PayPal webhook signature and event mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    payments.verify.mockResolvedValue(true);
    payments.reconcile.mockResolvedValue(undefined);
  });

  it('rejects a forged event without touching payments', async () => {
    payments.verify.mockResolvedValue(false);
    const response = await POST(webhook('PAYMENT.CAPTURE.COMPLETED', { id: 'capture-one' }));
    expect(response.status).toBe(401);
    expect(payments.reconcile).not.toHaveBeenCalled();
  });

  it('reconciles a verified successful capture by its order and capture IDs', async () => {
    const response = await POST(webhook('PAYMENT.CAPTURE.COMPLETED', {
      id: 'capture-one', supplementary_data: { related_ids: { order_id: 'order-one' } },
    }));
    expect(response.status).toBe(200);
    expect(payments.reconcile).toHaveBeenCalledWith({
      orderId: 'order-one', captureId: 'capture-one', status: 'paid',
    });
  });

  it('handles a refund using the linked capture rather than the refund ID', async () => {
    const response = await POST(webhook('PAYMENT.CAPTURE.REFUNDED', {
      id: 'refund-one', links: [{ rel: 'up', href: 'https://api-m.paypal.com/v2/payments/captures/capture-one' }],
    }));
    expect(response.status).toBe(200);
    expect(payments.reconcile).toHaveBeenCalledWith({
      orderId: undefined, captureId: 'capture-one', status: 'refunded',
    });
  });

  it('does not reconcile unrelated events', async () => {
    expect((await POST(webhook('SOME.OTHER.EVENT', { id: 'event-one' }))).status).toBe(200);
    expect(payments.reconcile).not.toHaveBeenCalled();
  });

  it('returns failure to PayPal so a reconciliation outage can be retried', async () => {
    payments.reconcile.mockRejectedValueOnce(new Error('database unavailable'));
    const response = await POST(webhook('PAYMENT.CAPTURE.COMPLETED', { id: 'capture-one' }));
    expect(response.status).toBe(500);
  });
});
