import { NextRequest, NextResponse } from 'next/server';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { ensureProposalPublicToken } from '@/lib/services/proposals-server';
import { mapProposalError } from '@/lib/services/proposal-api-utils';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await requireAgencySession();
    const { requestId } = await params;
    return NextResponse.json({ token: await ensureProposalPublicToken(requestId) });
  } catch (error) {
    return mapProposalError(error);
  }
}
