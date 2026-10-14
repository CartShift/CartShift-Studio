import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { getProspect } from '@/lib/services/prospects-server';
import { redactProspect } from '@/lib/services/prospect-privacy-server';
import { updateProspectSales } from '@/lib/services/prospect-sales-server';

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

export async function PATCH(request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const { prospectId } = await params;
    const update = await request.json();
    return NextResponse.json(await updateProspectSales(prospectId, update, session.uid));
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const invalid = error && typeof error === 'object' && 'issues' in error;
    const status = invalid || code === 'INVALID_PROSPECT_ID' ? 400 :
      code === 'FORBIDDEN' ? 403 : code === 'PROSPECT_NOT_FOUND' ? 404 :
      code === 'PROSPECT_SUPPRESSED' || code === 'OUTREACH_REVIEW_REQUIRED' ||
      code === 'TECHNICAL_REVIEW_REQUIRED' || code === 'INVALID_OWNER' ? 409 : 500;
    return NextResponse.json({ error: status === 500 ? 'Unable to update prospect' : code }, { status });
  }
}

export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (!body || Object.keys(body).length !== 1 || body.confirmation !== 'REDACT') {
      return NextResponse.json({ error: 'Explicit redaction confirmation required' }, { status: 400 });
    }
    const { prospectId } = await params;
    const result = await redactProspect(prospectId, session.uid);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'FOUNDER_REVIEW_REQUIRED' || code === 'FORBIDDEN' ? 403 :
      code === 'PROSPECT_NOT_FOUND' ? 404 :
      code === 'INVALID_PROSPECT_ID' ? 400 : 500;
    return NextResponse.json({ error: status === 500 ? 'Redaction failed' : code },
      { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
