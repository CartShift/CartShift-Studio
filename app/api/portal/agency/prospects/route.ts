import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { listProspects, upsertProspect } from '@/lib/services/prospects-server';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (message === 'ADMIN_NOT_CONFIGURED') return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  if (error && typeof error === 'object' && 'issues' in error) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  return NextResponse.json({ error: 'Could not process prospect request' }, { status: 500 });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try {
    const params = request.nextUrl.searchParams;
    return NextResponse.json(await listProspects({
      query: params.get('query') || '',
      limit: Number(params.get('limit') || 60),
    }, session.uid), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    const { store_url, brand_name, source_url, research_note } = body;
    return NextResponse.json(await upsertProspect({
      store_url, brand_name: brand_name || undefined,
      source_url, research_note: research_note || undefined,
      source_type: 'manual',
    }, session.uid), { status: 200 });
  } catch (error) { return errorResponse(error); }
}
