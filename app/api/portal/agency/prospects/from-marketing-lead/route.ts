import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { linkInboundLeadToProspect } from '@/lib/services/prospect-inbound-link-server';
import { z } from 'zod';

const schema = z.object({
  lead_id: z.string().regex(/^[A-Za-z0-9_-]{6,128}$/),
}).strict();

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const input = schema.parse(await request.json());
    return NextResponse.json(await linkInboundLeadToProspect(input.lead_id, session.uid), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error instanceof z.ZodError || code.startsWith('INVALID_') ||
      code === 'LEAD_STORE_URL_REQUIRED' || code === 'A public HTTPS business URL is required' ? 400 :
      code === 'FORBIDDEN' ? 403 :
      code === 'MARKETING_LEAD_NOT_FOUND' ? 404 :
      code === 'PROSPECT_SUPPRESSED' || code === 'LEAD_STORE_CHANGED' ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Could not link lead' : code },
      { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
