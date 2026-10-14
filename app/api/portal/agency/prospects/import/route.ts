import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/server-auth';
import { importProspectBatch } from '@/lib/services/prospects-server';
import { z } from 'zod';

const input = z.object({
  stores: z.array(z.object({
    store_url: z.string().trim().min(4).max(512),
    source_url: z.string().url().max(1024),
    brand_name: z.string().max(180).optional(),
    research_note: z.string().max(1000).optional(),
  }).strict()).min(1).max(20),
  confirm: z.boolean().optional(),
}).strict();

async function respond(request: NextRequest, confirm: boolean) {
  const session = await getServerSession(request);
  if (!session) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }
  try {
    const payload = input.parse(await request.json());
    if (confirm && payload.confirm !== true) {
      return NextResponse.json({ error: 'Explicit import confirmation required' }, { status: 400 });
    }
    const stores = payload.stores.map(store => ({ ...store, source_type: 'spreadsheet_import' }));
    return NextResponse.json(await importProspectBatch(stores, session.uid, !confirm), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const status = error instanceof z.ZodError || code.includes('Invalid') ||
      code.includes('HTTPS') ? 400 : code === 'FORBIDDEN' ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Import unavailable' : code }, { status });
  }
}

export async function POST(request: NextRequest) {
  return respond(request, false);
}

export async function PUT(request: NextRequest) {
  return respond(request, true);
}
