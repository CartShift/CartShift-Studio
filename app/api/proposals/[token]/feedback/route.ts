import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { submitPublicProposalFeedback } from '@/lib/services/proposals-server';
import { enforceProposalRateLimit, mapProposalError } from '@/lib/services/proposal-api-utils';

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  message: z.string().trim().min(3).max(2000),
  proposalVersion: z.number().int().min(0),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const limited = await enforceProposalRateLimit(request, 'proposal-feedback', token, 3);
    if (limited) return limited;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
    await submitPublicProposalFeedback(token, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return mapProposalError(error);
  }
}
