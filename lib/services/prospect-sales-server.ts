import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireProspectActor } from '@/lib/services/prospects-server';
import {
  prospectSalesUpdateSchema, prospectReviewSchema,
} from '@/lib/domain/prospect-sales';

const ID = /^prospect_[a-f0-9]{32}$/;
const contactAllowed = new Set(['consent_recorded', 'existing_relationship', 'approved_partner_channel']);

function database() {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return adminDb;
}

async function refFor(uid: string, prospectId: string) {
  const actor = await requireProspectActor(uid);
  if (!ID.test(prospectId)) throw new Error('INVALID_PROSPECT_ID');
  return { actor, ref: database().collection('agency_prospects').doc(prospectId) };
}

export async function updateProspectSales(prospectId: string, raw: unknown, uid: string) {
  const input = prospectSalesUpdateSchema.parse(raw);
  const { actor, ref } = await refFor(uid, prospectId);
  if (input.owner_uid) {
    const staffSnap = await database().collection('portal_users').doc(input.owner_uid).get();
    const staff = staffSnap.data();
    if (!staffSnap.exists || (staff?.accountType !== 'AGENCY' && staff?.isAgency !== true) ||
        !['owner', 'admin', 'sales_manager'].includes(staff?.agencyRole) ||
        staff?.status === 'inactive' || staff?.status === 'suspended') {
      throw new Error('INVALID_OWNER');
    }
  }
  const event = database().collection('agency_prospect_audit').doc();
  await database().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('PROSPECT_NOT_FOUND');
    const current = snap.data()!;
    if (current.doNotContact || current.stage === 'suppressed') throw new Error('PROSPECT_SUPPRESSED');
    if (input.stage && ['contact_ready', 'in_conversation'].includes(input.stage) &&
        !contactAllowed.has(current.outreachEligibility)) {
      throw new Error('OUTREACH_REVIEW_REQUIRED');
    }
    // A sales-status field never grants a technical approval or creates a proposal.
    if (input.stage === 'proposal' && current.technicalStatus !== 'approved') {
      throw new Error('TECHNICAL_REVIEW_REQUIRED');
    }
    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (input.stage) patch.stage = input.stage;
    if (input.owner_uid) patch.ownerUid = input.owner_uid;
    if (input.next_action !== undefined) patch.nextAction = input.next_action;
    if (input.due_date !== undefined) patch.nextActionAt = input.due_date;
    tx.update(ref, patch);
    tx.create(event, {
      uid, action: 'prospect.sales_update', targetId: prospectId, actorRole: actor.role,
      patchKeys: Object.keys(patch).filter(key => key !== 'updatedAt'),
      note: input.note || '', at: FieldValue.serverTimestamp(),
    });
  });
  return { prospect_id: prospectId, updated: true, next_step: input.next_action || null };
}

export async function reviewProspect(prospectId: string, raw: unknown, uid: string) {
  const input = prospectReviewSchema.parse(raw);
  const { actor, ref } = await refFor(uid, prospectId);
  if (!['owner', 'admin'].includes(actor.role)) throw new Error('FOUNDER_REVIEW_REQUIRED');
  const event = database().collection('agency_prospect_audit').doc();
  await database().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('PROSPECT_NOT_FOUND');
    if (snap.data()?.doNotContact === true) throw new Error('PROSPECT_SUPPRESSED');
    const blocked = input.outreach_eligibility === 'blocked';
    tx.update(ref, {
      outreachEligibility: input.outreach_eligibility,
      permissionEvidenceUrl: input.evidence_url || '',
      permissionNote: input.note,
      eligibilityReviewedBy: uid,
      eligibilityReviewedAt: FieldValue.serverTimestamp(),
      ...(blocked ? { doNotContact: true, stage: 'suppressed' } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, {
      uid, action: 'prospect.eligibility_review', targetId: prospectId,
      decision: input.outreach_eligibility,
      evidenceUrl: input.evidence_url || '', at: FieldValue.serverTimestamp(),
    });
  });
  return { prospect_id: prospectId, eligibility: input.outreach_eligibility,
    outreach_approved: contactAllowed.has(input.outreach_eligibility) };
}

export async function approveProspectTechnicalScope(prospectId: string, note: string, uid: string) {
  if (note.trim().length < 15 || note.trim().length > 1000) throw new Error('TECHNICAL_NOTE_REQUIRED');
  const { actor, ref } = await refFor(uid, prospectId);
  if (!['owner', 'admin'].includes(actor.role)) throw new Error('FOUNDER_REVIEW_REQUIRED');
  const event = database().collection('agency_prospect_audit').doc();
  await database().runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('PROSPECT_NOT_FOUND');
    if (snap.data()?.doNotContact) throw new Error('PROSPECT_SUPPRESSED');
    tx.update(ref, {
      technicalStatus: 'approved',
      technicalReviewedBy: uid, technicalReviewNote: note.trim(),
      technicalReviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, { uid, action: 'prospect.technical_review',
      targetId: prospectId, at: FieldValue.serverTimestamp() });
  });
  return { prospect_id: prospectId, technical_status: 'approved' };
}
