import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { acceptPublicProposal } from '@/lib/services/proposals-server';
import {
  enforceProposalRateLimit,
  getClientIp,
  mapProposalError,
} from '@/lib/services/proposal-api-utils';

const acceptanceSchema = z.object({
  termsAccepted: z.literal(true),
  acceptedByName: z.string().trim().min(2).max(160),
  acceptedByEmail: z.string().trim().email().max(320).optional().or(z.literal('')),
  signatureText: z.string().trim().min(2).max(160),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const limited = await enforceProposalRateLimit(request, 'proposal-accept', token, 6);
    if (limited) return limited;
    const parsed = acceptanceSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please complete the approval and signature fields.' }, { status: 400 });
    }
    const proposal = await acceptPublicProposal(token, parsed.data, {
      ip: getClientIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });
    return NextResponse.json(proposal);
  } catch (error) {
    return mapProposalError(error);
  }
}
