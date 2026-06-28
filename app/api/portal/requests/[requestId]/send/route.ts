import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { mapProposalError } from '@/lib/services/proposal-api-utils';
import { queueProposalOfferEmail } from '@/lib/services/proposals-server';

const schema = z.object({ locale: z.enum(['en', 'he']).default('en') });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await requireAgencySession(request);
    const { requestId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
    return NextResponse.json(await queueProposalOfferEmail(requestId, parsed.data.locale), {
      status: 202,
    });
  } catch (error) {
    return mapProposalError(error);
  }
}
