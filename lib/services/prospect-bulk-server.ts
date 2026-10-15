import 'server-only';
import { z } from 'zod';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireProspectActor } from '@/lib/services/prospects-server';

export const prospectBulkSchema = z.object({
  prospect_ids: z.array(z.string().regex(/^prospect_[a-f0-9]{32}$/)).min(1).max(20),
  patch: z.object({
    owner_uid: z.string().regex(/^[A-Za-z0-9_-]{6,128}$/).optional(),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    archived: z.boolean().optional(),
  }).strict().refine(value => Object.keys(value).length > 0, 'Select at least one change'),
}).strict().refine(input => new Set(input.prospect_ids).size === input.prospect_ids.length, 'Duplicate prospect IDs');

export async function bulkUpdateProspectWorklist(raw: unknown, uid: string) {
  const actor = await requireProspectActor(uid);
  const input = prospectBulkSchema.parse(raw);
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const database = adminDb;
  if (input.patch.owner_uid) {
    const assignee = await database.collection('portal_users').doc(input.patch.owner_uid).get();
    const member = assignee.data();
    if (!assignee.exists ||
        (member?.accountType !== 'AGENCY' && member?.isAgency !== true) ||
        !['owner', 'admin', 'sales_manager', 'business_development'].includes(String(member?.agencyRole || '')) ||
        ['inactive', 'suspended'].includes(String(member?.status || ''))) {
      throw new Error('INVALID_OWNER');
    }
  }
  const references = input.prospect_ids.map(id => database.collection('agency_prospects').doc(id));
  const update: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
    ...(input.patch.owner_uid ? { ownerUid: input.patch.owner_uid } : {}),
    ...(input.patch.priority ? { priority: input.patch.priority } : {}),
    ...(input.patch.archived !== undefined ? { archived: input.patch.archived } : {}),
  };
  await database.runTransaction(async tx => {
    const records = await Promise.all(references.map(ref => tx.get(ref)));
    for (const record of records) {
      if (!record.exists) throw new Error('PROSPECT_NOT_FOUND');
      const data = record.data() || {};
      if (data.doNotContact === true || data.stage === 'suppressed') {
        throw new Error('PROSPECT_SUPPRESSED');
      }
    }
    references.forEach(ref => {
      const audit = database.collection('agency_prospect_audit').doc();
      tx.update(ref, update);
      tx.create(audit, {
        uid, actorRole: actor.role, action: 'prospect.bulk_worklist_update',
        targetId: ref.id, patchKeys: Object.keys(update).filter(key => key !== 'updatedAt'),
        at: FieldValue.serverTimestamp(),
      });
    });
  });
  return { updated: references.length, message_sent: false, outreach_approved: false };
}
