import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { listAgencyWorkModes, saveAgencyWorkMode } from '@/lib/services/agency-work-modes-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function failure(error: unknown) {
  const msg = error instanceof Error ? error.message : 'Unexpected error';
  const status = msg === 'UNAUTHENTICATED' ? 401 : msg === 'FORBIDDEN' ? 403 :
    msg === 'NOT_FOUND' ? 404 : 500;
  return NextResponse.json({ error: msg }, { status });
}

export async function GET(request: NextRequest) {
  try { return NextResponse.json(await listAgencyWorkModes(request)); }
  catch (error) { return failure(error); }
}

const schema = z.object({
  orgId: z.string().min(6).max(128),
  defaultWorkMode: z.enum(['commercial', 'pro_bono']),
  internalRelationshipNote: z.string().max(1500).optional(),
}).strict();

export async function PATCH(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  try { return NextResponse.json(await saveAgencyWorkMode(request, parsed.data)); }
  catch (error) { return failure(error); }
}
