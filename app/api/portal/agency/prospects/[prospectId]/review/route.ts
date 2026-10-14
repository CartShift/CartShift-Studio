import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { reviewProspect, approveProspectTechnicalScope } from '@/lib/services/prospect-sales-server';

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
    const body = await request.json();
    const result = body?.type === 'technical'
      ? await approveProspectTechnicalScope(prospectId, String(body.note || ''), session.uid)
      : body?.type === 'contact'
        ? await reviewProspect(prospectId, {
          outreach_eligibility: body.outreach_eligibility,
          evidence_url: body.evidence_url,
          note: body.note,
        }, session.uid)
        : null;
    if (!result) return NextResponse.json({ error: 'Invalid review type' }, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error && typeof error === 'object' && 'issues' in error ? 400 :
      code === 'FORBIDDEN' || code === 'FOUNDER_REVIEW_REQUIRED' ? 403 :
      code === 'PROSPECT_NOT_FOUND' ? 404 :
      code === 'PROSPECT_SUPPRESSED' ? 409 :
      code === 'TECHNICAL_NOTE_REQUIRED' ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? 'Review failed' : code }, { status });
  }
}
