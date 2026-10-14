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

export async function reviewProspectFinding(prospectId: string, findingId: string,
  status: 'verified' | 'rejected' | 'stale', note: string, uid: string) {
  if (!/^finding_[a-f0-9]{32}$/.test(findingId)) throw new Error('INVALID_FINDING_ID');
  if (!['verified', 'rejected', 'stale'].includes(status) ||
      typeof note !== 'string' || note.trim().length < 15 || note.length > 1000) {
    throw new Error('INVALID_FINDING_REVIEW');
  }
  const { actor, ref } = await refFor(uid, prospectId);
  if (!['owner', 'admin'].includes(actor.role)) throw new Error('FOUNDER_REVIEW_REQUIRED');
  const finding = ref.collection('findings').doc(findingId);
  const event = database().collection('agency_prospect_audit').doc();
  await database().runTransaction(async tx => {
    const [storeSnapshot, findingSnapshot] = await Promise.all([tx.get(ref), tx.get(finding)]);
    if (!storeSnapshot.exists || !findingSnapshot.exists) throw new Error('PROSPECT_FINDING_NOT_FOUND');
    const previous = findingSnapshot.data()?.verificationStatus || 'unverified';
    tx.update(finding, {
      verificationStatus: status,
      reviewedBy: uid, reviewedAt: FieldValue.serverTimestamp(), reviewNote: note.trim(),
    });
    const delta = (status === 'verified' ? 1 : 0) - (previous === 'verified' ? 1 : 0);
    if (delta !== 0) tx.update(ref, {
      verifiedIssueCount: FieldValue.increment(delta),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, { uid, action: 'prospect.finding_review',
      targetId: prospectId, findingId, decision: status, at: FieldValue.serverTimestamp() });
  });
  return { prospect_id: prospectId, finding_id: findingId, verification_status: status };
}

export async function linkProspectProposal(prospectId: string, orgId: string,
  requestId: string, note: string, uid: string) {
  if (!/^[a-zA-Z0-9_-]{6,128}$/.test(orgId) ||
      !/^[a-zA-Z0-9_-]{6,128}$/.test(requestId) ||
      note.trim().length < 15 || note.length > 1000) {
    throw new Error('INVALID_LINK_ARGUMENTS');
  }
  const { actor, ref } = await refFor(uid, prospectId);
  const orgRef = database().collection('portal_organizations').doc(orgId);
  const requestRef = database().collection('portal_requests').doc(requestId);
  const event = database().collection('agency_prospect_audit').doc();

  let newStage = 'proposal';
  let proposalStatus = '';
  await database().runTransaction(async tx => {
    const [prospect, org, request] = await Promise.all([
      tx.get(ref), tx.get(orgRef), tx.get(requestRef),
    ]);
    if (!prospect.exists) throw new Error('PROSPECT_NOT_FOUND');
    if (prospect.data()?.doNotContact) throw new Error('PROSPECT_SUPPRESSED');
    if (prospect.data()?.technicalStatus !== 'approved') throw new Error('TECHNICAL_REVIEW_REQUIRED');
    if (!org.exists || org.data()?.removedAt || org.data()?.status === 'inactive') {
      throw new Error('ORG_NOT_FOUND');
    }
    const proposal = request.data();
    if (!request.exists || proposal?.orgId !== orgId || proposal.isBillable !== true) {
      throw new Error('PROPOSAL_NOT_FOUND');
    }
    proposalStatus = String(proposal.status || '');
    if (!['QUOTED', 'ACCEPTED', 'PAID'].includes(proposalStatus)) {
      throw new Error('PROPOSAL_NOT_READY');
    }
    newStage = ['ACCEPTED', 'PAID'].includes(proposalStatus) ? 'won' : 'proposal';
    tx.update(ref, {
      linkedOrgId: orgId, linkedRequestId: requestId, stage: newStage,
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, {
      uid, actorRole: actor.role, action: 'prospect.linked_proposal',
      targetId: prospectId, linkedOrgId: orgId, linkedRequestId: requestId,
      proposalStatus, note: note.trim(), at: FieldValue.serverTimestamp(),
    });
  });
  return { prospect_id: prospectId, org_id: orgId, request_id: requestId,
    proposal_status: proposalStatus, sales_stage: newStage,
    cash_collected_confirmed: proposalStatus === 'PAID' };
}

export async function deleteProspectContactCandidate(prospectId: string, contactId: string, uid: string) {
  if (!/^contact_[a-f0-9]{32}$/.test(contactId)) throw new Error('INVALID_CONTACT_ID');
  const { actor, ref } = await refFor(uid, prospectId);
  if (!['owner', 'admin'].includes(actor.role)) throw new Error('FOUNDER_REVIEW_REQUIRED');
  const contact = ref.collection('contacts').doc(contactId);
  const event = database().collection('agency_prospect_audit').doc();
  await database().runTransaction(async tx => {
    const [prospect, existing] = await Promise.all([tx.get(ref), tx.get(contact)]);
    if (!prospect.exists || !existing.exists) throw new Error('CONTACT_NOT_FOUND');
    tx.delete(contact);
    // Keep only the derived candidate ID so a later scan cannot re-import
    // a contact that the founder deliberately removed.
    tx.update(ref, { suppressedContactIds: FieldValue.arrayUnion(contactId),
      updatedAt: FieldValue.serverTimestamp() });
    tx.create(event, { uid, action: 'prospect.contact_removed',
      targetId: prospectId, contactId, at: FieldValue.serverTimestamp() });
  });
  return { prospect_id: prospectId, contact_id: contactId, removed: true };
}
