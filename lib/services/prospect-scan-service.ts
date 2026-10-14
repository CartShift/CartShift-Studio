import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import {
  addProspectContactCandidate, addProspectFinding, requireProspectActor,
} from '@/lib/services/prospects-server';
import { runProspectSiteAudit } from '@/lib/services/prospect-site-audit';

const COOLDOWN_MS = 15 * 60 * 1000;
const LOCK_MS = 2 * 60 * 1000;

export async function scanProspect(prospectId: string, uid: string) {
  await requireProspectActor(uid);
  if (!/^prospect_[a-f0-9]{32}$/.test(prospectId)) throw new Error('INVALID_PROSPECT_ID');
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  const ref = adminDb.collection('agency_prospects').doc(prospectId);
  const now = Date.now();

  let storeUrl: string | undefined;
  await adminDb.runTransaction(async transaction => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new Error('PROSPECT_NOT_FOUND');
    const data = snap.data()!;
    if (data.doNotContact || data.stage === 'suppressed') throw new Error('PROSPECT_SUPPRESSED');
    const previous = Number(data.scanStartedAtMs || 0);
    if (previous && now - previous < COOLDOWN_MS) throw new Error('SCAN_COOLDOWN');
    if (Number(data.scanLockUntilMs || 0) > now) throw new Error('SCAN_IN_PROGRESS');
    storeUrl = String(data.storeUrl || '');
    transaction.update(ref, {
      scanStatus: 'running',
      scanStartedAtMs: now,
      scanLockUntilMs: now + LOCK_MS,
      scanRequestedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  try {
    // Only explicit, rate-limited, server-side public page audit.
    const result = await runProspectSiteAudit(storeUrl!);
    let findingsSaved = 0;
    let contactsSaved = 0;
    for (const finding of result.findings) {
      const saved = await addProspectFinding({
        prospect_id: prospectId, category: finding.category, title: finding.title,
        observed_url: finding.observed_url, evidence_excerpt: finding.evidence_excerpt,
        business_relevance: finding.business_relevance,
      }, uid);
      if (saved.created) findingsSaved++;
    }
    for (const contact of result.contacts) {
      const saved = await addProspectContactCandidate({
        prospect_id: prospectId, role: contact.role, name: contact.name,
        business_email: contact.business_email,
        source_url: contact.source_url, evidence_excerpt: contact.evidence_excerpt,
      }, uid);
      if (saved.created) contactsSaved++;
    }
    await ref.update({
      platform: result.platform,
      lastAuditedAt: FieldValue.serverTimestamp(),
      lastScanPageCount: result.scannedUrls.length,
      scanStatus: 'completed',
      scanLockUntilMs: 0,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return {
      prospect_id: prospectId, status: 'completed',
      platform: result.platform,
      scanned_urls: result.scannedUrls, skipped_urls: result.skippedUrls,
      findings_saved: findingsSaved, contact_candidates_saved: contactsSaved,
      findings_verification: 'unverified', outreach_approved: false,
    };
  } catch (error) {
    await ref.update({
      scanStatus: 'failed',
      scanStartedAtMs: 0,
      scanLockUntilMs: 0,
      updatedAt: FieldValue.serverTimestamp(),
    }).catch(() => {});
    throw error;
  }
}
