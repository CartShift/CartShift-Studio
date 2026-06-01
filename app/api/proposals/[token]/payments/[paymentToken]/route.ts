import { NextRequest, NextResponse } from 'next/server';
import { getPublicProposalPayment } from '@/lib/services/proposals-server';
import { enforceProposalRateLimit, mapProposalError } from '@/lib/services/proposal-api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; paymentToken: string }> }
) {
  try {
    const { token, paymentToken } = await params;
    const limited = await enforceProposalRateLimit(request, 'proposal-payment-read', paymentToken, 30);
    if (limited) return limited;
    const result = await getPublicProposalPayment(token, paymentToken);
    if (!result) return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return mapProposalError(error);
  }
}
