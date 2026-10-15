import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { listProspects, upsertProspect } from '@/lib/services/prospects-server';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (message === 'INVALID_PAGE_CURSOR') return NextResponse.json({ error: 'Invalid page cursor' }, { status: 400 });
  if (message === 'ADMIN_NOT_CONFIGURED') return NextResponse.json({ error: 'Unavailable' }, { status: 503 });
  if (message === 'A public HTTPS business URL is required' ||
      message === 'Invalid store domain') {
    return NextResponse.json({ error: 'Invalid public store or research source URL' }, { status: 400 });
  }
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
      limit: Number(params.get('limit') || 40),
      cursor: params.get('cursor') || undefined,
      segment: params.get('segment') || undefined,
      priority: params.get('priority') || undefined,
      active_only: params.get('active_only') === 'true',
      owner_uid: params.get('owner_uid') || undefined,
      verified_only: params.get('verified_only') === 'true',
      due_before: params.get('due_before') || undefined,
      review_requested: params.get('review_requested') === 'true',
    }, session.uid), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
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
