import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { addProspectActivity } from '@/lib/services/prospect-activities-server';
import { ZodError } from 'zod';

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ prospectId: string }>;
}) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const { prospectId } = await params;
    return NextResponse.json(await addProspectActivity(prospectId, await request.json(), session.uid),
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error instanceof ZodError || code.startsWith('INVALID_') ? 400 :
      code === 'FORBIDDEN' || code === 'FOUNDER_REVIEW_REQUIRED' ? 403 :
      code === 'PROSPECT_NOT_FOUND' ? 404 :
      code === 'PROSPECT_SUPPRESSED' || code === 'OUTREACH_REVIEW_REQUIRED' ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Activity could not be saved' : code },
      { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
