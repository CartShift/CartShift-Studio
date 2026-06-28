import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { captureMarketingLead } from '@/lib/services/marketing';
import { humanReviewRequestSchema } from '@/lib/validation';
import { enforceApiRateLimit, rateLimitHeaders } from '@/lib/utils/api-rate-limit';

const LIMIT = 3;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rateLimit = await enforceApiRateLimit(request, 'human-review', {
    maxRequests: LIMIT,
    windowMs: WINDOW_MS,
    allowUserAgentFallback: process.env.NODE_ENV !== 'production',
    tooManyRequestsMessage:
      'Weekly review capacity reached for this connection. Please try again later.',
  });
  if ('response' in rateLimit) return rateLimit.response;

  const parsed = humanReviewRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid review request', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  if (!adminDb)
    return NextResponse.json({ error: 'Review service is unavailable' }, { status: 503 });
  const db = adminDb;

  const data = parsed.data;
  const requestId = randomBytes(18).toString('base64url');
  const domain = new URL(data.storeUrl).hostname
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .slice(0, 48);
  const publicAuditSlug = `${domain}-${randomBytes(5).toString('hex')}`;
  const now = new Date();
  const partner =
    data.attribution?.lastTouch.partnerCode ||
    data.attribution?.lastTouch.referralCode ||
    data.attribution?.lastTouch.utmSource;

  await db
    .collection('human_review_requests')
    .doc(requestId)
    .set({
      ...data,
      email: data.email.trim().toLowerCase(),
      requestId,
      status: 'requested',
      qualified: false,
      reviewVisibility: 'private',
      publicAuditSlug,
      anonymousInsightConsent: data.anonymousInsightConsent,
      namedStoreConsent: data.anonymousInsightConsent && data.namedStoreConsent,
      consentTimestamp: data.anonymousInsightConsent ? now : null,
      consentVersion: data.consentVersion,
      partner: partner || null,
      createdAt: now,
      updatedAt: now,
    });

  const agencyUsers = await db
    .collection('portal_users')
    .where('isAgency', '==', true)
    .limit(20)
    .get();
  const notificationBatch = db.batch();
  agencyUsers.docs.forEach(user => {
    const notification = db.collection('portal_notifications').doc();
    notificationBatch.set(notification, {
      userId: user.id,
      type: 'human_review_requested',
      title: 'Human Store Review requested',
      body: `${domain} requested three prioritized recommendations.`,
      link: '/portal/agency/leads',
      read: false,
      createdAt: now,
    });
  });
  if (!agencyUsers.empty) await notificationBatch.commit();

  await captureMarketingLead({
    email: data.email,
    storeUrl: data.storeUrl,
    locale: data.locale,
    source: 'human_review',
    platform: data.platform,
    overallScore: data.overallScore,
    intent: data.intent,
    primaryIssue: data.primaryIssue,
    ctaType: `human_review_${data.primaryIssue}`,
    attribution: data.attribution,
    metadata: { reviewRequestId: requestId, partner: partner || null },
    skipWelcome: true,
  });

  return NextResponse.json(
    { success: true, requestId },
    { headers: rateLimitHeaders(LIMIT, rateLimit.result.remaining) }
  );
}
