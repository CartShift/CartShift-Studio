import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { bulkUpdateProspectWorklist } from '@/lib/services/prospect-bulk-server';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    return NextResponse.json(await bulkUpdateProspectWorklist(await request.json(), session.uid), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error instanceof z.ZodError ? 400 :
      code === 'FORBIDDEN' ? 403 :
      code === 'PROSPECT_NOT_FOUND' ? 404 :
      ['INVALID_OWNER', 'PROSPECT_SUPPRESSED'].includes(code) ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Bulk update failed' : code },
      { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
