import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase-admin';
import { enforceApiRateLimit } from '@/lib/utils/api-rate-limit';

const schema = z.object({
  eventId: z.string().uuid(),
  sessionId: z.string().uuid(),
  name: z.enum([
    'store_analyzer_viewed',
    'store_analyzer_intent_selected',
    'store_analyzer_url_submitted',
    'store_analyzer_email_submitted',
    'store_analyzer_started',
    'store_analyzer_completed',
    'store_analyzer_report_viewed',
    'store_analyzer_cta_clicked',
    'human_review_requested',
    'human_review_submitted',
    'booking_started',
    'booking_completed',
    'blog_analyzer_cta_viewed',
    'blog_analyzer_cta_clicked',
    'partner_attributed',
  ]),
  path: z.string().max(500),
  occurredAt: z.string().datetime(),
  properties: z
    .record(z.string().max(60), z.union([z.string().max(160), z.number(), z.boolean(), z.null()]))
    .default({}),
});

export async function POST(request: NextRequest) {
  const limit = await enforceApiRateLimit(request, 'analyzer-event', {
    maxRequests: 120,
    windowMs: 60_000,
    allowUserAgentFallback: true,
  });
  if ('response' in limit) return limit.response;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !adminDb)
    return NextResponse.json({ ok: false }, { status: parsed.success ? 503 : 400 });
  const { eventId, ...event } = parsed.data;
  await adminDb
    .collection('analyzer_funnel_events')
    .doc(eventId)
    .create({ ...event, createdAt: new Date() })
    .catch(error => {
      if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
    });
  if (event.name === 'partner_attributed' && typeof event.properties.partner === 'string') {
    const code = event.properties.partner
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
    if (code)
      await adminDb
        .collection('referral_partners')
        .doc(code)
        .set(
          { code, status: 'unverified', lastAttributedAt: new Date(), createdAt: new Date() },
          { merge: true }
        );
  }
  return NextResponse.json({ ok: true });
}
