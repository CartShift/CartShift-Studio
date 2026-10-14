import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { linkProspectProposal } from '@/lib/services/prospect-sales-server';
import { z } from 'zod';

const schema = z.object({
  org_id: z.string().min(6).max(128),
  request_id: z.string().min(6).max(128),
  note: z.string().trim().min(15).max(1000),
}).strict();

export async function POST(request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const { prospectId } = await params;
    const parsed = schema.parse(await request.json());
    return NextResponse.json(await linkProspectProposal(prospectId, parsed.org_id,
      parsed.request_id, parsed.note, session.uid));
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error instanceof z.ZodError || code.startsWith('INVALID_') ? 400 :
      code === 'FORBIDDEN' ? 403 : code.includes('_NOT_FOUND') ? 404 :
      code === 'PROSPECT_SUPPRESSED' || code === 'TECHNICAL_REVIEW_REQUIRED' ||
      code === 'PROPOSAL_NOT_READY' || code === 'ORG_DOMAIN_MISMATCH' ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Proposal link failed' : code }, { status });
  }
}
