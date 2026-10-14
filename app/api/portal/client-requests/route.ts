import { NextRequest, NextResponse } from 'next/server';
import { readClientRequests } from '@/lib/services/client-requests-server';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('orgId') || '';
    const projectId = request.nextUrl.searchParams.get('projectId') || undefined;
    if (!orgId || orgId.length > 128 || (projectId && projectId.length > 128)) {
      return NextResponse.json({ error: 'INVALID_ARGUMENT' }, { status: 400 });
    }
    const items = await readClientRequests(request, orgId, projectId);
    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const name = error instanceof Error ? error.message : '';
    const status = name === 'UNAUTHENTICATED' ? 401 :
      name === 'FORBIDDEN' ? 403 : name === 'NOT_FOUND' ? 404 :
      name === 'RESULT_LIMIT_EXCEEDED' ? 413 : 500;
    return NextResponse.json({ error: status === 500 ? 'Request failed' : name }, { status });
  }
}
