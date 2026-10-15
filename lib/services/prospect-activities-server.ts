import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { prospectActivitySchema, isContactAllowed } from '@/lib/domain/prospect-activities';
import { requireProspectActor } from '@/lib/services/prospects-server';

const ID = /^prospect_[a-f0-9]{32}$/;
export async function addProspectActivity(prospectId: string, raw: unknown, uid: string) {
  const actor = await requireProspectActor(uid);
  if (!ID.test(prospectId)) throw new Error('INVALID_PROSPECT_ID');
  const input = prospectActivitySchema.parse(raw);
  if (input.kind === 'review_completed' && !['owner','admin'].includes(actor.role)) {
    throw new Error('FOUNDER_REVIEW_REQUIRED');
  }
  if (input.occurred_at && new Date(input.occurred_at).getTime() > Date.now() + 60_000) {
    throw new Error('INVALID_ACTIVITY_DATE');
  }
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const ref = adminDb.collection('agency_prospects').doc(prospectId);
  const event = ref.collection('activities').doc();
  const audit = adminDb.collection('agency_prospect_audit').doc();
  await adminDb.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('PROSPECT_NOT_FOUND');
    const existing = snap.data()!;
    if (existing.doNotContact === true || existing.stage === 'suppressed') {
      throw new Error('PROSPECT_SUPPRESSED');
    }
    if (input.direction === 'outbound' && !isContactAllowed(String(existing.outreachEligibility || ''))) {
      throw new Error('OUTREACH_REVIEW_REQUIRED');
    }
    tx.create(event, {
      kind: input.kind, direction: input.direction, outcome: input.outcome, note: input.note,
      occurredAt: input.occurred_at ? new Date(input.occurred_at) : FieldValue.serverTimestamp(),
      recordedAt: FieldValue.serverTimestamp(), actorUid: uid,
    });
    tx.update(ref, {
      lastActivityAt: FieldValue.serverTimestamp(),
      activityCount: FieldValue.increment(1),
      ...(input.direction === 'outbound' ? { lastContactedAt: FieldValue.serverTimestamp() } : {}),
      ...(input.kind === 'review_request' ? { deepReviewStatus: 'requested' } : {}),
      ...(input.kind === 'review_completed' ? { deepReviewStatus: 'completed' } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(audit, {
      uid, action: 'prospect.activity_added', targetId: prospectId,
      activityId: event.id, kind: input.kind, direction: input.direction,
      at: FieldValue.serverTimestamp(),
    });
  });
  return { prospect_id: prospectId, activity_id: event.id, recorded: true, message_sent: false };
}
