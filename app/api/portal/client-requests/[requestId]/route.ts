import { NextRequest, NextResponse } from 'next/server';
import { readClientRequest } from '@/lib/services/client-requests-server';

export async function GET(request: NextRequest, { params }: {
  params: Promise<{ requestId: string }>
}) {
  try {
    const { requestId } = await params;
    if (!requestId || requestId.length > 150 || requestId.includes('/')) {
      return NextResponse.json({ error: 'INVALID_ARGUMENT' }, { status: 400 });
    }
    return NextResponse.json({ request: await readClientRequest(request, requestId) },
      { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const name = error instanceof Error ? error.message : '';
    const status = name === 'UNAUTHENTICATED' ? 401 :
      name === 'FORBIDDEN' ? 403 : name === 'NOT_FOUND' ? 404 : 500;
    return NextResponse.json({ error: status === 500 ? 'Request failed' : name }, { status });
  }
}
