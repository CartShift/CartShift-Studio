import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { normalizeProspectStoreUrl, prospectDocumentId } from '@/lib/domain/prospects';
import { requireProspectActor } from '@/lib/services/prospects-server';

/** Safely convert a user-submitted inbound store domain into a private sales candidate.
 * No personal contact, marketing consent or send history is transferred.
 */
export async function linkInboundLeadToProspect(leadId: string, uid: string) {
  await requireProspectActor(uid);
  if (!/^[A-Za-z0-9_-]{6,128}$/.test(leadId)) throw new Error('INVALID_LEAD_ID');
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const db = adminDb;
  const leadRef = db.collection('marketing_leads').doc(leadId);
  const inbound = await leadRef.get();
  if (!inbound.exists || typeof inbound.data()?.storeUrl !== 'string') {
    throw new Error('MARKETING_LEAD_NOT_FOUND');
  }
  const { canonicalDomain, storeUrl } = normalizeProspectStoreUrl(String(inbound.data()?.storeUrl));
  const prospectId = prospectDocumentId(canonicalDomain);
  const prospectRef = db.collection('agency_prospects').doc(prospectId);
  const auditRef = db.collection('agency_prospect_audit').doc();
  let created = false;
  let alreadyLinked = false;
  await db.runTransaction(async tx => {
    const latest = await tx.get(leadRef);
    if (!latest.exists || typeof latest.data()?.storeUrl !== 'string') {
      throw new Error('MARKETING_LEAD_NOT_FOUND');
    }
    const currentDomain = normalizeProspectStoreUrl(String(latest.data()?.storeUrl)).canonicalDomain;
    if (currentDomain !== canonicalDomain) throw new Error('LEAD_STORE_CHANGED');
    const existing = await tx.get(prospectRef);
    if (existing.exists) {
      const prior = existing.data() || {};
      if (prior.doNotContact === true || prior.stage === 'suppressed') {
        throw new Error('PROSPECT_SUPPRESSED');
      }
      const links = Array.isArray(prior.linkedMarketingLeadIds) ? prior.linkedMarketingLeadIds : [];
      alreadyLinked = links.includes(leadId);
      if (!alreadyLinked) {
        tx.update(prospectRef, {
          linkedMarketingLeadIds: FieldValue.arrayUnion(leadId),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      created = true;
      tx.create(prospectRef, {
        canonicalDomain, storeUrl,
        brandName: typeof latest.data()?.company === 'string' && latest.data()?.company.trim()
          ? String(latest.data()?.company).trim().slice(0, 180) : canonicalDomain,
        sourceUrl: storeUrl, sourceType: 'inbound_marketing',
        researchNote: 'Inbound review inquiry, unverified store ownership and technology; channel eligibility still requires independent review.',
        linkedMarketingLeadIds: [leadId],
        stage: 'needs_review', segment: 'merchant', priority: 'normal', archived: false,
        platform: 'unknown', outreachEligibility: 'review_required', doNotContact: false,
        ownerUid: uid, createdBy: uid,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      });
    }
    if (!alreadyLinked) {
      tx.create(auditRef, {
        uid, action: 'prospect.inbound_lead_linked', prospectId, leadId,
        created, at: FieldValue.serverTimestamp(),
      });
    }
  });
  return {
    prospect_id: prospectId, canonical_domain: canonicalDomain,
    created, duplicate: !created, already_linked: alreadyLinked,
    outreach_approved: false, message_sent: false,
  };
}
