import { NextRequest, NextResponse } from 'next/server';
import { requireAgencySession } from '@/lib/auth/server-agency';
import { markProjectReadyForLaunch } from '@/lib/services/project-readiness-server';

export async function POST(request: NextRequest, { params }: {
  params: Promise<{ projectId: string }>
}) {
  try {
    await requireAgencySession(request);
    const { projectId } = await params;
    if (!/^[A-Za-z0-9_-]{6,150}$/.test(projectId)) {
      return NextResponse.json({ error: 'INVALID_PROJECT_ID' }, { status: 400 });
    }
    await markProjectReadyForLaunch(projectId);
    return NextResponse.json({ updated: true, projectId }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = code === 'UNAUTHENTICATED' ? 401 :
      code === 'FORBIDDEN' ? 403 : code === 'NOT_FOUND' ? 404 :
      ['PROJECT_NOT_READY', 'INVALID_STATE'].includes(code) ? 409 : 500;
    return NextResponse.json({ error: status >= 500 ? 'Could not update project' : code }, { status });
  }
}
