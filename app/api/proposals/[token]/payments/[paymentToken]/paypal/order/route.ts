import { NextRequest, NextResponse } from 'next/server';
import { createPayPalProposalOrder } from '@/lib/services/paypal-server';
import { getPublicProposalPayment, savePayPalOrder } from '@/lib/services/proposals-server';
import { enforceProposalRateLimit, mapProposalError } from '@/lib/services/proposal-api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; paymentToken: string }> }
) {
  try {
    const { token, paymentToken } = await params;
    const limited = await enforceProposalRateLimit(request, 'paypal-order', paymentToken, 8);
    if (limited) return limited;
    const result = await getPublicProposalPayment(token, paymentToken);
    if (!result) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    if (result.payment.status !== 'pending' && result.payment.status !== 'failed') {
      return NextResponse.json({ error: 'Payment request is not payable' }, { status: 400 });
    }
    const order = await createPayPalProposalOrder({
      paymentId: result.payment.id,
      amount: result.payment.amount,
      currency: result.payment.currency,
      label: result.payment.label,
    });
    await savePayPalOrder(paymentToken, order.id);
    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    return mapProposalError(error);
  }
}
