import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import {
  canMoveReviewStatus, normalizeReviewStore, storeReviewWorkUpdateSchema,
  type StoreReviewStatus,
} from '@/lib/domain/store-review';

export function reviewDb() {
  if (!adminDb) throw new Error('SERVICE_UNAVAILABLE');
  return adminDb;
}

export async function assertReviewEditor(uid: string) {
  const snap = await reviewDb().collection('portal_users').doc(uid).get();
  const value = snap.data();
  if (!snap.exists || value?.status === 'suspended' ||
    (value?.isAgency !== true && value?.accountType !== 'AGENCY') ||
    !['owner','admin'].includes(value?.agencyRole || '')) {
    throw new Error('FORBIDDEN');
  }
  return { uid };
}

export function reviewRef(id: string) {
  if (!/^[A-Za-z0-9_-]{12,64}$/.test(id)) throw new Error('INVALID_REVIEW_ID');
  return reviewDb().collection('human_review_requests').doc(id);
}

export async function getStoreReview(id: string, uid: string) {
  await assertReviewEditor(uid);
  const snap = await reviewRef(id).get();
  if (!snap.exists) throw new Error('NOT_FOUND');
  const data = snap.data()!;
  return {
    ...data, requestId: snap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    statusHistory: (data.statusHistory || []).map((entry: {at?: {toDate?:()=>Date}; status:string; actor:string}) => ({
      ...entry, at: entry.at?.toDate?.()?.toISOString() || entry.at || null,
    })),
    // The UI uses server-authorized access; never serve this object publicly.
  };
}

export async function patchStoreReview(id: string, raw: unknown, uid: string) {
  await assertReviewEditor(uid);
  const parsed = storeReviewWorkUpdateSchema.parse(raw);
  const ref = reviewRef(id);
  await reviewDb().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('NOT_FOUND');
    const current = snap.data()!;
    if (current.schemaVersion !== 2) throw new Error('LEGACY_REVIEW_READ_ONLY');
    const previous = (current.reviewStatus || current.status || 'requested') as StoreReviewStatus;
    if (previous === 'delivered' || previous === 'declined') throw new Error('REVIEW_CLOSED');
    const status = parsed.status;
    if (status && !canMoveReviewStatus(previous, status)) throw new Error('INVALID_TRANSITION');
    if (status === 'delivered') throw new Error('DELIVERY_REQUIRES_EMAIL');
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (status) {
      patch.reviewStatus = status;
      patch.status = status;
      patch.statusHistory = [...(current.statusHistory || []),
        { status, at: new Date(), actor: uid }];
    }
    if (parsed.qualified !== undefined) patch.qualified = parsed.qualified;
    if (parsed.nextAction !== undefined) patch.nextAction = parsed.nextAction;
    if (parsed.summary !== undefined || parsed.findings !== undefined) {
      const summary = parsed.summary ?? current.reviewReport?.summary ?? '';
      const findings = parsed.findings ?? current.reviewReport?.findings ?? [];
      const domain = current.canonicalDomain ||
        normalizeReviewStore(current.storeUrl).canonicalDomain;
      for (const finding of findings) {
        if (normalizeReviewStore(finding.observedUrl).canonicalDomain !== domain) {
          throw new Error('CROSS_STORE_EVIDENCE');
        }
      }
      patch.reviewReport = { summary, findings, version: (current.reviewReport?.version || 0) + 1,
        updatedBy: uid, updatedAt: new Date() };
    }
    tx.update(ref, patch);
  });
  return { updated: true };
}
