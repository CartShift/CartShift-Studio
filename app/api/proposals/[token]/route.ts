import { NextRequest, NextResponse } from 'next/server';
import { getPublicProposal } from '@/lib/services/proposals-server';
import { enforceProposalRateLimit, mapProposalError } from '@/lib/services/proposal-api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const limited = await enforceProposalRateLimit(request, 'proposal-read', token, 30);
    if (limited) return limited;
    const proposal = await getPublicProposal(token);
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    return NextResponse.json(proposal);
  } catch (error) {
    return mapProposalError(error);
  }
}
