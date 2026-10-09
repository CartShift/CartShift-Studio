import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkServerRateLimit } from '@/lib/services/server-rate-limiter';
import { getClientIpFromRequest } from '@/lib/utils/api-rate-limit';
import { ERROR_CATEGORIES, SAFE_FIREBASE_CODES } from '@/lib/observability/safe-error-event';

const eventSchema = z.object({
  event: z.literal('portal.client_error'),
  eventId: z.string().uuid(),
  category: z.enum(ERROR_CATEGORIES),
  code: z.enum([...SAFE_FIREBASE_CODES, 'unknown']),
}).strict();

export async function POST(request: NextRequest) {
  // Only a browser executing on this origin may submit diagnostics.
  const origin = request.headers.get('origin');
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get('content-length') || '0');
  if (declaredLength > 2048) {
    return NextResponse.json({ error: 'Event too large' }, { status: 413 });
  }
  const rate = await checkServerRateLimit(
    `portal:telemetry:${getClientIpFromRequest(request) || 'unknown'}`,
    30,
    60_000
  );
  if (!rate.allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });

  // Bound the actual streaming payload, even when Content-Length is omitted.
  // Never buffer or print an arbitrary client-supplied error body.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: 'Empty event' }, { status: 400 });
  const decoder = new TextDecoder();
  let raw = '';
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2048) {
        await reader.cancel();
        return NextResponse.json({ error: 'Event too large' }, { status: 413 });
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
  let data: unknown = null;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = eventSchema.safeParse(data);
  if (!payload.success) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
  }

  // Validated allow-listed metadata only, never log arbitrary client strings.
  console.error('[portal-client-telemetry]', JSON.stringify(payload.data));
  return NextResponse.json({ received: true }, { status: 202 });
}
