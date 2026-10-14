import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { minimalSuppressedProspect } from '@/lib/domain/prospect-privacy';
import { requireProspectActor } from '@/lib/services/prospects-server';

export async function redactProspect(prospectId: string, uid: string) {
  const actor = await requireProspectActor(uid);
  if (!['owner', 'admin'].includes(actor.role)) throw new Error('FOUNDER_REVIEW_REQUIRED');
  if (!/^prospect_[a-f0-9]{32}$/.test(prospectId)) throw new Error('INVALID_PROSPECT_ID');
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const database = adminDb;
  const ref = database.collection('agency_prospects').doc(prospectId);
  let domain = '';

  // Set suppression *before* deleting child data, blocking scanner writes mid-purge.
  await database.runTransaction(async tx => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error('PROSPECT_NOT_FOUND');
    domain = String(doc.data()?.canonicalDomain || '');
    tx.update(ref, {
      doNotContact: true, stage: 'suppressed', outreachEligibility: 'blocked',
      redactionState: 'in_progress', updatedAt: FieldValue.serverTimestamp(),
    });
  });

  let removed = 0;
  // Small, bounded batches avoid Firestore's 500-operation batch limit.
  // Retrying after a partial failure is safe because suppression is sticky.
  for (const child of ['findings', 'contacts']) {
    for (;;) {
      const docs = await ref.collection(child).limit(100).get();
      if (docs.empty || docs.docs.length === 0) break;
      const batch = database.batch();
      for (const doc of docs.docs) batch.delete(doc.ref);
      await batch.commit();
      removed += docs.docs.length;
    }
  }

  // Full replacement intentionally drops brand/contact names, research notes,
  // private source URLs, personal emails, assignees and commercial draft context.
  // The canonical business domain is retained solely to enforce future suppression.
  await ref.set({
    ...minimalSuppressedProspect(domain),
    redactedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  await database.collection('agency_prospect_audit').add({
    uid, action: 'prospect.redacted', targetId: prospectId,
    removedChildRecords: removed, at: FieldValue.serverTimestamp(),
  });
  return { prospect_id: prospectId, suppressed: true, redacted: true,
    child_records_deleted: removed };
}
