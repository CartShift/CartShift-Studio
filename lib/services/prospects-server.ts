import 'server-only';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
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
      !['owner', 'admin', 'sales_manager'].includes(role) ||
      data?.status === 'inactive' || data?.status === 'suspended') {
    throw new Error('FORBIDDEN');
  }
  return { uid, role: role as 'owner' | 'admin' | 'sales_manager' };
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
    scanStatus: String(data.scanStatus || 'not_scanned'),
    lastScanPageCount: Number(data.lastScanPageCount || 0),
    lastAuditedAt: iso(data.lastAuditedAt),
    createdAt: iso(data.createdAt), updatedAt: iso(data.updatedAt),
  };
}

export async function listProspects(raw: unknown, uid: string) {
  await requireProspectActor(uid);
  const input = z.object({
    query: z.string().trim().max(150).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }).strict().parse(raw);
  const snapshot = await db().collection(COLLECTION).orderBy('updatedAt', 'desc').limit(100).get();
  const all = snapshot.docs.map(doc => summary(doc.id, doc.data()));
  const filter = (input.query || '').toLocaleLowerCase();
  const filtered = filter ? all.filter(x =>
    [x.brandName, x.canonicalDomain, x.stage].some(s => s.toLocaleLowerCase().includes(filter))
  ) : all;
  const limit = input.limit || 60;
  return { prospects: filtered.slice(0, limit), truncated: snapshot.size === 100 || filtered.length > limit };
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
  const [findings, contacts] = await Promise.all([
    ref.collection('findings').orderBy('createdAt', 'desc').limit(50).get(),
    ref.collection('contacts').orderBy('createdAt', 'desc').limit(30).get(),
  ]);
  return { prospect: summary(prospectId, snap.data() || {}),
    findings: findings.docs.map(doc => ({
      id: doc.id, category: doc.data().category, title: doc.data().title,
      observedUrl: doc.data().observedUrl, evidenceExcerpt: doc.data().evidenceExcerpt,
      businessRelevance: doc.data().businessRelevance || '',
      verificationStatus: 'unverified', observedAt: iso(doc.data().createdAt),
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
    const previous = await tx.get(finding);
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
    const previous = await tx.get(contactRef);
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
