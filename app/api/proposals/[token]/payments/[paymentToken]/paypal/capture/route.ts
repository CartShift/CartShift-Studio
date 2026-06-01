import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { capturePayPalProposalOrder } from '@/lib/services/paypal-server';
import {
  assertPayPalOrderForPayment,
  getPublicProposalPayment,
  reconcileProposalPayment,
} from '@/lib/services/proposals-server';
import { enforceProposalRateLimit, mapProposalError } from '@/lib/services/proposal-api-utils';

const captureSchema = z.object({ orderId: z.string().trim().min(1).max(128) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; paymentToken: string }> }
) {
  try {
    const { token, paymentToken } = await params;
    const limited = await enforceProposalRateLimit(request, 'paypal-capture', paymentToken, 8);
    if (limited) return limited;
    const parsed = captureSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'PayPal order is required' }, { status: 400 });
    const payment = await getPublicProposalPayment(token, paymentToken);
    if (!payment) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    await assertPayPalOrderForPayment(token, paymentToken, parsed.data.orderId);
    const capture = await capturePayPalProposalOrder(parsed.data.orderId);
    const paypalCapture = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const isPaid = capture.status === 'COMPLETED' || paypalCapture?.status === 'COMPLETED';
    await reconcileProposalPayment({
      orderId: capture.id || parsed.data.orderId,
      captureId: paypalCapture?.id,
      status: isPaid ? 'paid' : 'failed',
    });
    const updated = await getPublicProposalPayment(token, paymentToken);
    return NextResponse.json(updated);
  } catch (error) {
    return mapProposalError(error);
  }
}
