import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { scanProspect } from '@/lib/services/prospect-scan-service';

export const runtime = 'nodejs';
export const maxDuration = 120;

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
    const outcome = await scanProspect(prospectId, session.uid);
    return NextResponse.json(outcome, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FORBIDDEN' ? 403 :
      code === 'PROSPECT_NOT_FOUND' ? 404 :
      code === 'SCAN_COOLDOWN' || code === 'SCAN_IN_PROGRESS' ? 409 :
      code === 'INVALID_PROSPECT_ID' ? 400 :
      code === 'PROSPECT_SUPPRESSED' || code.startsWith('SCAN_') ? 422 : 500;
    return NextResponse.json({ error: status === 500 ? 'Scan failed' : code }, { status });
  }
}
