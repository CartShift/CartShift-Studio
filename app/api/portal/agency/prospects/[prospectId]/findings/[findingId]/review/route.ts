import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { reviewProspectFinding } from '@/lib/services/prospect-sales-server';
import { z } from 'zod';

const bodySchema = z.object({
  decision: z.enum(['verified', 'rejected', 'stale']),
  note: z.string().trim().min(15).max(1000),
}).strict();

export async function POST(request: NextRequest,
  { params }: { params: Promise<{ prospectId: string; findingId: string }> }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const { prospectId, findingId } = await params;
    const parsed = bodySchema.parse(await request.json());
    return NextResponse.json(await reviewProspectFinding(prospectId, findingId,
      parsed.decision, parsed.note, session.uid));
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error instanceof z.ZodError || code.startsWith('INVALID_') ? 400 :
      code === 'FORBIDDEN' || code === 'FOUNDER_REVIEW_REQUIRED' ? 403 :
      code === 'PROSPECT_FINDING_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: status === 500 ? 'Finding review failed' : code }, { status });
  }
}
