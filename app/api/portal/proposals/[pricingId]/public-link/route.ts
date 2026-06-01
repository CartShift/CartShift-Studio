import { NextRequest, NextResponse } from 'next/server';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { ensureProposalPublicToken } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pricingId: string }> }
) {
  try {
    await requireAgencySession();
    const { pricingId } = await params;
    const token = await ensureProposalPublicToken(pricingId);
    return NextResponse.json({ token });
  } catch (error) {
    return mapProposalError(error);
  }
}
