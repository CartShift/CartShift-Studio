import 'server-only';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { inferProspectSegment } from '@/lib/domain/prospect-activities';
import { prospectContactCandidateSchema } from '@/lib/domain/prospect-contacts';
import { adminDb } from '@/lib/firebase-admin';
import { normalizeProspectStoreUrl, prospectDocumentId, prospectFindingSchema,
  upsertProspectSchema, validateProspectSource, verifyProspectEvidenceUrl } from '@/lib/domain/prospects';

const COLLECTION = 'agency_prospects';
const AUDIT = 'agency_prospect_audit';
const idSchema = z.string().regex(/^prospect_[0-9a-f]{32}$/);

function db() {
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return adminDb;
}

export async function requireProspectActor(uid: string) {
  const snap = await db().collection('portal_users').doc(uid).get();
  const data = snap.data();
  const role = data?.agencyRole;
  if (!snap.exists || (data?.accountType !== 'AGENCY' && data?.isAgency !== true) ||
      !['owner', 'admin', 'sales_manager', 'business_development'].includes(role) ||
      data?.status === 'inactive' || data?.status === 'suspended') {
    throw new Error('FORBIDDEN');
  }
  return { uid, role: role as 'owner' | 'admin' | 'sales_manager' | 'business_development' };
}

function iso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value &&
      typeof value.toDate === 'function') return (value.toDate() as Date).toISOString();
  return value instanceof Date ? value.toISOString() : null;
}

function summary(id: string, data: Record<string, unknown>) {
  return {
    id, brandName: String(data.brandName || data.canonicalDomain || ''),
    canonicalDomain: String(data.canonicalDomain || ''),
    storeUrl: String(data.storeUrl || ''),
    stage: String(data.stage || 'needs_review'),
    platform: String(data.platform || 'unknown'),
    outreachEligibility: String(data.outreachEligibility || 'review_required'),
    doNotContact: data.doNotContact === true,
    sourceUrl: String(data.sourceUrl || ''),
    sourceType: String(data.sourceType || ''),
    researchNote: String(data.researchNote || ''),
    ownerUid: String(data.ownerUid || ''),
    nextAction: String(data.nextAction || ''),
    nextActionAt: String(data.nextActionAt || ''),
    technicalStatus: String(data.technicalStatus || 'needs_review'),
    linkedOrgId: String(data.linkedOrgId || ''),
    linkedRequestId: String(data.linkedRequestId || ''),
    scanStatus: String(data.scanStatus || 'not_scanned'),
    segment: inferProspectSegment(String(data.researchNote || ''), String(data.segment || '')),
    priority: String(data.priority || 'normal'),
    archived: data.archived === true || (data.archived === undefined && String(data.researchNote || '').includes('ארכיון לא-פעיל')),
    activityCount: Number(data.activityCount || 0),
    deepReviewStatus: String(data.deepReviewStatus || 'not_requested'),
    lastContactedAt: iso(data.lastContactedAt),
    lastActivityAt: iso(data.lastActivityAt),
    lastScanPageCount: Number(data.lastScanPageCount || 0),
    verifiedIssueCount: Number(data.verifiedIssueCount || 0),
    lastAuditedAt: iso(data.lastAuditedAt),
    createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt),
  };
}

export async function listProspects(raw: unknown, uid: string) {
  await requireProspectActor(uid);
  const input = z.object({
    query: z.string().trim().max(150).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().regex(/^prospect_[a-f0-9]{32}$/).optional(),
    segment: z.enum(['merchant', 'agency_partner', 'unknown']).optional(),
    priority: z.enum(['high', 'normal', 'low']).optional(),
    active_only: z.boolean().optional(),
    owner_uid: z.string().max(128).optional(),
    verified_only: z.boolean().optional(),
  }).strict().parse(raw);
  const limit = input.limit || 40;
  const items: ReturnType<typeof summary>[] = [];
  const search = (input.query || '').toLocaleLowerCase();
  const collection = db().collection(COLLECTION);
  let query = collection.orderBy('updatedAt', 'desc');
  if (input.cursor) {
    const cursor = await collection.doc(input.cursor).get();
    if (!cursor.exists) throw new Error('INVALID_PAGE_CURSOR');
    query = query.startAfter(cursor);
  }
  let nextCursor: string | null = null;
  let truncated = false;
  // Bounded server-side filtering; cursor progresses by the last scanned document,
  // so it never silently skips matching results when a page fills mid-batch.
  for (let page = 0; page < 10; page++) {
    const batch = await query.limit(100).get();
    if (batch.empty) { truncated = false; nextCursor = null; break; }
    let scanned = 0;
    for (const doc of batch.docs) {
      scanned++;
      const item = summary(doc.id, doc.data());
      nextCursor = doc.id;
      if (input.segment && item.segment !== input.segment) continue;
      if (input.priority && item.priority !== input.priority) continue;
      if (input.active_only && item.archived) continue;
      if (input.owner_uid && item.ownerUid !== input.owner_uid) continue;
      if (input.verified_only && item.verifiedIssueCount < 1) continue;
      if (search && ![item.brandName, item.canonicalDomain, item.stage, item.researchNote]
        .some(value => value.toLocaleLowerCase().includes(search))) continue;
      items.push(item);
      if (items.length === limit) break;
    }
    if (items.length === limit) {
      truncated = scanned < batch.size || batch.size === 100;
      if (!truncated) nextCursor = null;
      break;
    }
    if (batch.size < 100) { truncated = false; nextCursor = null; break; }
    truncated = true;
    const last = batch.docs[batch.docs.length - 1];
    nextCursor = last.id;
    query = collection.orderBy('updatedAt', 'desc').startAfter(last);
  }
  return { prospects: items, truncated, nextCursor, scanningEnabled: process.env.PROSPECT_SCANS_ENABLED === 'true' };
}

export async function upsertProspect(raw: unknown, uid: string) {
  await requireProspectActor(uid);
  const input = upsertProspectSchema.parse(raw);
  const { canonicalDomain, storeUrl } = normalizeProspectStoreUrl(input.store_url);
  const sourceUrl = validateProspectSource(input.source_url);
  const prospectId = prospectDocumentId(canonicalDomain);
  const database = db();
  const ref = database.collection(COLLECTION).doc(prospectId);
  const event = database.collection(AUDIT).doc();
  const created = await database.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists) return false;
    tx.create(ref, {
      canonicalDomain, storeUrl, brandName: input.brand_name || canonicalDomain,
      sourceUrl, sourceType: input.source_type, researchNote: input.research_note || '',
      stage: 'needs_review', platform: 'unknown', outreachEligibility: 'review_required',
      doNotContact: false, ownerUid: uid, createdBy: uid,
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, { uid, action: 'prospect.created', prospectId,
      at: FieldValue.serverTimestamp() });
    return true;
  });
  return { prospect_id: prospectId, canonical_domain: canonicalDomain,
    created, duplicate: !created, outreach_approved: false };
}

export async function getProspect(rawId: string, uid: string) {
  await requireProspectActor(uid);
  const prospectId = idSchema.parse(rawId);
  const ref = db().collection(COLLECTION).doc(prospectId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Prospect not found');
  const [findings, contacts, activities] = await Promise.all([
    ref.collection('findings').orderBy('createdAt', 'desc').limit(50).get(),
    ref.collection('contacts').orderBy('createdAt', 'desc').limit(30).get(),
    ref.collection('activities').orderBy('recordedAt', 'desc').limit(60).get(),
  ]);
  return { prospect: summary(prospectId, snap.data() || {}),
    findings: findings.docs.map(doc => ({
      id: doc.id, category: doc.data().category, title: doc.data().title,
      observedUrl: doc.data().observedUrl, evidenceExcerpt: doc.data().evidenceExcerpt,
      businessRelevance: doc.data().businessRelevance || '',
      verificationStatus: doc.data().verificationStatus || 'unverified',
      reviewNote: doc.data().reviewNote || '',
      observedAt: iso(doc.data().createdAt),
    })),
    activities: activities.docs.map(doc => ({
      id: doc.id, kind: doc.data().kind, direction: doc.data().direction,
      outcome: doc.data().outcome, note: doc.data().note, actorUid: doc.data().actorUid,
      occurredAt: iso(doc.data().occurredAt), recordedAt: iso(doc.data().recordedAt),
    })),
    contacts: contacts.docs.map(doc => ({
      id: doc.id, role: doc.data().role, name: doc.data().name || '',
      businessEmail: doc.data().businessEmail || '',
      sourceUrl: doc.data().sourceUrl, evidenceExcerpt: doc.data().evidenceExcerpt,
      status: 'candidate', marketingConsent: false, observedAt: iso(doc.data().createdAt),
    })),
  };
}

export async function addProspectFinding(raw: unknown, uid: string) {
  await requireProspectActor(uid);
  const input = prospectFindingSchema.parse(raw);
  const database = db();
  const ref = database.collection(COLLECTION).doc(input.prospect_id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Prospect not found');
  const observedUrl = verifyProspectEvidenceUrl(input.observed_url,
    String(snap.data()?.canonicalDomain || ''));
  const hash = createHash('sha256').update([input.prospect_id, input.category,
    observedUrl, input.title, input.evidence_excerpt].join('|')).digest('hex').slice(0, 32);
  const findingId = 'finding_' + hash;
  const finding = ref.collection('findings').doc(findingId);
  const event = database.collection(AUDIT).doc();
  const created = await database.runTransaction(async tx => {
    const [prospect, previous] = await Promise.all([tx.get(ref), tx.get(finding)]);
    if (!prospect.exists || prospect.data()?.doNotContact === true) {
      throw new Error('PROSPECT_SUPPRESSED');
    }
    if (previous.exists) return false;
    tx.create(finding, {
      category: input.category, title: input.title, observedUrl,
      evidenceExcerpt: input.evidence_excerpt,
      businessRelevance: input.business_relevance || '',
      verificationStatus: 'unverified', createdBy: uid, createdAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, { uid, action: 'prospect.finding_added', prospectId: input.prospect_id,
      findingId, at: FieldValue.serverTimestamp() });
    return true;
  });
  return { prospect_id: input.prospect_id, finding_id: findingId,
    created, duplicate: !created, verification_status: 'unverified' };
}

export async function addProspectContactCandidate(raw: unknown, uid: string) {
  await requireProspectActor(uid);
  const input = prospectContactCandidateSchema.parse(raw);
  const database = db();
  const ref = database.collection(COLLECTION).doc(input.prospect_id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('Prospect not found');
  if (snap.data()?.doNotContact === true) throw new Error('Prospect suppressed');
  const sourceUrl = verifyProspectEvidenceUrl(input.source_url,
    String(snap.data()?.canonicalDomain || ''));
  const hash = createHash('sha256').update([input.prospect_id, input.role,
    input.name || '', input.business_email || '', sourceUrl].join('|')).digest('hex').slice(0, 32);
  const contactId = 'contact_' + hash;
  const contactRef = ref.collection('contacts').doc(contactId);
  const event = database.collection(AUDIT).doc();
  const created = await database.runTransaction(async tx => {
    const [prospect, previous] = await Promise.all([tx.get(ref), tx.get(contactRef)]);
    if (!prospect.exists || prospect.data()?.doNotContact === true) {
      throw new Error('PROSPECT_SUPPRESSED');
    }
    if ((prospect.data()?.suppressedContactIds || []).includes(contactId)) {
      return false;
    }
    if (previous.exists) return false;
    tx.create(contactRef, {
      role: input.role, name: input.name || null,
      businessEmail: input.business_email || null,
      sourceUrl, evidenceExcerpt: input.evidence_excerpt,
      status: 'candidate', outreachEligibility: 'review_required',
      marketingConsent: false, createdBy: uid, createdAt: FieldValue.serverTimestamp(),
    });
    tx.create(event, { uid, action: 'prospect.contact_candidate_added',
      prospectId: input.prospect_id, contactId, at: FieldValue.serverTimestamp() });
    return true;
  });
  return { prospect_id: input.prospect_id, contact_id: contactId,
    created, duplicate: !created, status: 'candidate', outreach_approved: false };
}

export async function importProspectBatch(raw: unknown, uid: string, dryRun = false) {
  await requireProspectActor(uid);
  const parsed = z.array(upsertProspectSchema).min(1).max(20).parse(raw);
  const sourceDomains = new Set<string>();
  const plan: Array<{ input: z.infer<typeof upsertProspectSchema>; prospectId: string;
    canonicalDomain: string; exists: boolean }> = [];
  // Validate every item and check for duplicates before any write.
  for (const input of parsed) {
    const normalized = normalizeProspectStoreUrl(input.store_url);
    validateProspectSource(input.source_url);
    if (sourceDomains.has(normalized.canonicalDomain)) continue;
    sourceDomains.add(normalized.canonicalDomain);
    const prospectId = prospectDocumentId(normalized.canonicalDomain);
    const existing = await db().collection(COLLECTION).doc(prospectId).get();
    plan.push({ input, prospectId,
      canonicalDomain: normalized.canonicalDomain, exists: existing.exists });
  }
  if (dryRun) return {
    dry_run: true, requested: parsed.length, unique: plan.length,
    prospects: plan.map(({ prospectId, canonicalDomain, exists }) =>
      ({ prospect_id: prospectId, canonical_domain: canonicalDomain, exists })),
  };
  const results = [];
  for (const row of plan) {
    results.push(await upsertProspect(row.input, uid));
  }
  return {
    dry_run: false, requested: parsed.length, unique: plan.length,
    created: results.filter(result => result.created).length,
    duplicate: results.filter(result => result.duplicate).length,
    results,
  };
}
