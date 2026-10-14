import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { storeReviewRequestSchema, normalizeReviewStore } from '@/lib/domain/store-review';
import { captureMarketingLead } from '@/lib/services/marketing';
import { verifyRecaptchaToken } from '@/lib/services/recaptcha-server';
import { enforceApiRateLimit, rateLimitHeaders } from '@/lib/utils/api-rate-limit';

const MAX_REQUESTS = 8;
const DUPLICATE_WINDOW_MS = 48 * 60 * 60 * 1000;
const NO_CACHE = { 'Cache-Control': 'no-store' };

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'ORIGIN_NOT_ALLOWED' }, { status: 403, headers: NO_CACHE });
  }
  if (process.env.NODE_ENV === 'production' && process.env.STORE_REVIEW_INTAKE_ENABLED !== 'true') {
    return NextResponse.json({ error: 'INTAKE_PAUSED' }, { status: 503, headers: NO_CACHE });
  }

  const limited = await enforceApiRateLimit(request, 'expert-store-review', {
    maxRequests: MAX_REQUESTS,
    windowMs: 60 * 60 * 1000,
    allowUserAgentFallback: process.env.NODE_ENV !== 'production',
    tooManyRequestsMessage: 'Too many review requests. Please try again later.',
  });
  if ('response' in limited) return limited.response;

  const parsed = storeReviewRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400, headers: NO_CACHE });
  }
  const data = parsed.data;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (process.env.NODE_ENV === 'production' && !secret) {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503, headers: NO_CACHE });
  }
  if (secret && !(await verifyRecaptchaToken(data.captchaToken || '', secret, 'request_store_review'))) {
    return NextResponse.json({ error: 'SECURITY_CHECK_FAILED' }, { status: 403, headers: NO_CACHE });
  }
  if (!adminDb) {
    return NextResponse.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503, headers: NO_CACHE });
  }
  let normalized;
  try {
    normalized = normalizeReviewStore(data.storeUrl);
  } catch {
    return NextResponse.json({ error: 'INVALID_STORE_URL' }, { status: 400, headers: NO_CACHE });
  }
  const db = adminDb;
  const email = data.email.trim().toLowerCase();
  const fingerprint = createHash('sha256').update(email + '\0' + normalized.canonicalDomain).digest('hex');
  const marker = db.collection('store_review_dedupe').doc(fingerprint);
  const newRef = db.collection('human_review_requests').doc(randomBytes(18).toString('base64url'));
  const now = new Date();
  const partner = data.attribution?.lastTouch.partnerCode || data.attribution?.lastTouch.referralCode || null;
  let created = false;
  let requestId = newRef.id;
  try {
    const result = await db.runTransaction(async tx => {
      const markerSnapshot = await tx.get(marker);
      const previous = markerSnapshot.data();
      const lastSeen = previous?.createdAt?.toDate?.()?.getTime() || 0;
      if (previous?.requestId && now.getTime() - lastSeen < DUPLICATE_WINDOW_MS) {
        return { requestId: String(previous.requestId), created: false };
      }
      const slug = normalized.canonicalDomain.replace(/[^a-z0-9]+/gi, '-').slice(0, 45)
        + '-' + randomBytes(5).toString('hex');
      tx.create(newRef, {
        schemaVersion: 2,
        requestId: newRef.id,
        source: 'expert_store_review',
        storeUrl: normalized.storeUrl,
        canonicalDomain: normalized.canonicalDomain,
        name: data.name,
        email,
        locale: data.locale,
        focus: data.focus || null,
        primaryIssue: 'general_conversion',
        notes: data.notes || '',
        attribution: data.attribution || null,
        partner,
        status: 'requested',
        reviewStatus: 'requested',
        salesStage: 'new',
        statusHistory: [{ status: 'requested', at: now, actor: 'visitor' }],
        qualified: false,
        marketingConsent: data.marketingOptIn,
        privacyNoticeVersion: '2026-10-14',
        reviewVisibility: 'private',
        anonymousInsightConsent: false,
        namedStoreConsent: false,
        publicAuditSlug: slug,
        createdAt: now,
        updatedAt: now,
      });
      tx.set(marker, { requestId: newRef.id, createdAt: now });
      return { requestId: newRef.id, created: true };
    });
    requestId = result.requestId;
    created = result.created;
  } catch {
    return NextResponse.json({ error: 'SAVE_FAILED' }, { status: 503, headers: NO_CACHE });
  }

  // The request is already durable. Secondary systems must never produce a false submission failure.
  if (created) {
    try {
      const agencyUsers = await db.collection('portal_users').where('isAgency', '==', true).limit(20).get();
      if (!agencyUsers.empty) {
        const notifications = db.batch();
        agencyUsers.docs.forEach(user => {
          notifications.set(db.collection('portal_notifications').doc('store-review-' + requestId + '-' + user.id), {
            userId: user.id, type: 'human_review_requested',
            title: 'New expert store review request',
            body: normalized.canonicalDomain + ' requested a professional review.',
            link: '/portal/agency/leads', read: false, createdAt: now,
          }, { merge: true });
        });
        await notifications.commit();
      }
    } catch {
      console.warn('[store-review] Staff notification not delivered', { requestId });
    }
    const captured = await captureMarketingLead({
      email, name: data.name, storeUrl: normalized.storeUrl, locale: data.locale,
      source: 'human_review', intent: data.focus, primaryIssue: 'general_conversion',
      ctaType: 'expert_store_review', subscribeNewsletter: data.marketingOptIn,
      consent: data.marketingOptIn, skipWelcome: true,
      attribution: data.attribution, metadata: { reviewRequestId: requestId },
    });
    if (!captured.success) console.warn('[store-review] Marketing mirror pending', { requestId });
  }

  return NextResponse.json({ success: true, requestId, status: 'requested', deduplicated: !created }, {
    status: created ? 201 : 200,
    headers: { ...NO_CACHE, ...rateLimitHeaders(MAX_REQUESTS, limited.result.remaining) },
  });
}
