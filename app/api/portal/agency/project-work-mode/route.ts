import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveProjectWorkMode } from '@/lib/services/agency-work-modes-server';

export const runtime = 'nodejs';
const schema = z.object({
  orgId: z.string().min(6).max(128),
  projectId: z.string().min(6).max(128),
  workMode: z.enum(['commercial', 'pro_bono']),
}).strict();

export async function PATCH(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  try { return NextResponse.json(await saveProjectWorkMode(request, parsed.data)); }
  catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN';
    const status = message === 'UNAUTHENTICATED' ? 401 : message === 'FORBIDDEN' ? 403 :
      message === 'NOT_FOUND' ? 404 : message === 'EXISTING_COMMERCIAL_WORK' ||
      message === 'CREATE_NEW_COMMERCIAL_PROJECT' || message === 'TOO_MANY_REQUESTS' ||
      message === 'NONZERO_RATE' ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
