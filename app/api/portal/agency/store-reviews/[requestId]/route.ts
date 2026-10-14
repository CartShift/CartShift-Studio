import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { getStoreReview, patchStoreReview } from '@/lib/services/store-review-admin-server';

const headers = { 'Cache-Control': 'no-store' };
const statusForError = (error: unknown) => {
  const msg = error instanceof Error ? error.message : '';
  if (msg === 'FORBIDDEN') return 403;
  if (msg === 'NOT_FOUND') return 404;
  if (msg === 'SERVICE_UNAVAILABLE') return 503;
  if (['INVALID_TRANSITION','REVIEW_CLOSED','LEGACY_REVIEW_READ_ONLY',
    'CROSS_STORE_EVIDENCE','DELIVERY_REQUIRES_EMAIL'].includes(msg)) return 409;
  if (msg === 'INVALID_REVIEW_ID' || (error && typeof error === 'object' && 'issues' in error)) return 400;
  return 500;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{requestId: string}> }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401, headers });
  try {
    const { requestId } = await params;
    return NextResponse.json({ review: await getStoreReview(requestId, session.uid) }, { headers });
  } catch (error) {
    const status = statusForError(error);
    return NextResponse.json({ error: status === 500 ? 'READ_FAILED' : (error as Error).message }, { status, headers });
  }
}

export async function PATCH(request: NextRequest, { params }: {params: Promise<{requestId: string}>}) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401, headers });
  if (request.headers.get('origin') && request.headers.get('origin') !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'ORIGIN_NOT_ALLOWED' }, { status: 403, headers });
  }
  try {
    const { requestId } = await params;
    return NextResponse.json(await patchStoreReview(requestId, await request.json(), session.uid), { headers });
  } catch (error) {
    const status = statusForError(error);
    return NextResponse.json({ error: status === 500 ? 'UPDATE_FAILED' : (error as Error).message }, { status, headers });
  }
}
