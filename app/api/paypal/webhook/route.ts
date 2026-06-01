import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/services/paypal-server';
import { reconcileProposalPayment } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';

type PayPalWebhook = {
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: { related_ids?: { order_id?: string; capture_id?: string } };
    links?: Array<{ rel?: string; href?: string }>;
  };
};

function getLinkedCaptureId(event: PayPalWebhook): string | undefined {
  const direct = event.resource?.supplementary_data?.related_ids?.capture_id;
  if (direct) return direct;
  const upLink = event.resource?.links?.find(link => link.rel === 'up')?.href;
  return upLink?.split('/').filter(Boolean).pop();
}

export async function POST(request: NextRequest) {
  try {
    const event = (await request.json()) as PayPalWebhook;
    const verified = await verifyPayPalWebhook({
      transmissionId: request.headers.get('paypal-transmission-id'),
      transmissionTime: request.headers.get('paypal-transmission-time'),
      certUrl: request.headers.get('paypal-cert-url'),
      authAlgo: request.headers.get('paypal-auth-algo'),
      transmissionSig: request.headers.get('paypal-transmission-sig'),
      webhookEvent: event,
    });
    if (!verified) return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });

    const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      await reconcileProposalPayment({ orderId, captureId: event.resource?.id, status: 'paid' });
    } else if (event.event_type === 'PAYMENT.CAPTURE.DENIED') {
      await reconcileProposalPayment({ orderId, captureId: event.resource?.id, status: 'failed' });
    } else if (
      event.event_type === 'PAYMENT.CAPTURE.REFUNDED' ||
      event.event_type === 'PAYMENT.CAPTURE.REVERSED'
    ) {
      await reconcileProposalPayment({
        orderId,
        captureId: getLinkedCaptureId(event),
        status: 'refunded',
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return mapProposalError(error);
  }
}
