import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { deleteProspectContactCandidate } from '@/lib/services/prospect-sales-server';

export async function DELETE(request: NextRequest,
  { params }: { params: Promise<{ prospectId: string; contactId: string }> }) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const { prospectId, contactId } = await params;
    return NextResponse.json(await deleteProspectContactCandidate(prospectId, contactId, session.uid));
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code.startsWith('INVALID_') ? 400 :
      code === 'FORBIDDEN' || code === 'FOUNDER_REVIEW_REQUIRED' ? 403 :
      code === 'CONTACT_NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: status === 500 ? 'Could not remove candidate' : code }, { status });
  }
}
