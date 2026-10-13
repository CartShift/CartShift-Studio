import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { getProspect } from '@/lib/services/prospects-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try {
    const { prospectId } = await params;
    return NextResponse.json(await getProspect(prospectId, session.uid),
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    const status = msg === 'FORBIDDEN' ? 403 : msg === 'Prospect not found' ? 404 :
      msg === 'ADMIN_NOT_CONFIGURED' ? 503 : msg === 'Invalid prospect ID' ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? 'Could not load prospect' : msg }, { status });
  }
}
