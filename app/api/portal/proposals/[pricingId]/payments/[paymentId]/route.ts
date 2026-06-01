import { NextRequest, NextResponse } from 'next/server';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { cancelProposalPayment } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ pricingId: string; paymentId: string }> }
) {
  try {
    await requireAgencySession();
    const { pricingId, paymentId } = await params;
    await cancelProposalPayment(pricingId, paymentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return mapProposalError(error);
  }
}
