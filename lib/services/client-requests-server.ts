import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';
import type { NextRequest } from 'next/server';

/** Client reads are served by a whitelist. Firestore SDK never exposes draft/agency fields. */
const SAFE_FIELDS = [
  'orgId', 'projectId', 'title', 'description', 'type', 'status', 'priority',
  'createdBy', 'createdByName', 'assignedTo', 'assignedToName', 'tags', 'attachmentIds',
  'commentCount', 'createdAt', 'updatedAt', 'closedAt', 'deliveredAt',
  'requestRole', 'parentRequestId', 'childRequestIds', 'lastComment',
  'milestones', 'currentMilestoneId', 'estimatedHours', 'isBillable',
  'lineItems', 'totalAmount', 'subtotal', 'taxAmount', 'taxRate', 'currency',
  'validUntil', 'quotedAt', 'paymentDueAt', 'paymentStatus', 'amountPaid',
  'balanceDue', 'clientNotes', 'acceptedAt', 'declinedAt', 'paidAt',
  'timeframe', 'workDeadline', 'proposalContent', 'terms', 'clientName',
  'paymentRequired', 'depositAmount', 'proposalVersion', 'relatedRequestId',
] as const;

type StoredRequest = Record<string, unknown>;
export function isCommercialRequestRecord(row: StoredRequest): boolean {
  return row.isBillable === true || Boolean(row.publicToken) ||
    row.requestRole === 'bundle' || row.requestRole === 'bundle_item';
}

export function sanitizeClientRequest(id: string, row: StoredRequest): StoredRequest | null {
  const commercial = isCommercialRequestRecord(row);
  if (commercial) {
    const stage = String(row.status || '');
    const shared = stage !== 'DRAFT' && (
      row.requestRole === 'bundle_item' ||
      row.publicAccessEnabled === true ||
      ['ACCEPTED', 'PAID', 'QUEUED', 'IN_PROGRESS', 'IN_REVIEW', 'DELIVERED', 'CLOSED'].includes(stage)
    );
    if (!shared) return null;
  }
  // Published signed terms override any unpublished working-draft edits.
  const published = commercial && row.publishedProposal &&
    typeof row.publishedProposal === 'object' && !Array.isArray(row.publishedProposal)
    ? row.publishedProposal as StoredRequest : {};
  const merged = { ...row, ...published };
  const result: StoredRequest = { id };
  for (const field of SAFE_FIELDS) {
    if (merged[field] !== undefined) result[field] = merged[field];
  }
  // Work execution/payment status is operational and must not be rolled back
  // to a historic published commercial snapshot.
  result.status = row.status;
  result.projectId = row.projectId ?? null;
  return result;
}

async function sessionFor(request: NextRequest) {
  const session = await getServerSession(request);
  if (!session) throw new Error('UNAUTHENTICATED');
  if (!adminDb) throw new Error('ADMIN_NOT_CONFIGURED');
  return session;
}

async function orgAccess(orgId: string, uid: string): Promise<boolean> {
  const db = adminDb!;
  const [org, member] = await Promise.all([
    db.collection('portal_organizations').doc(orgId).get(),
    db.collection('portal_members').doc(orgId + '_' + uid).get(),
  ]);
  return org.exists && !org.data()?.removedAt &&
    (org.data()?.createdBy === uid || member.exists);
}

export async function readClientRequest(request: NextRequest, requestId: string) {
  const session = await sessionFor(request);
  const snapshot = await adminDb!.collection('portal_requests').doc(requestId).get();
  if (!snapshot.exists) throw new Error('NOT_FOUND');
  const row = snapshot.data()!;
  const inOrg = await orgAccess(row.orgId, session.uid);
  if (!inOrg && row.createdBy !== session.uid &&
    !(session.email && row.clientEmail === session.email)) {
    throw new Error('FORBIDDEN');
  }
  const sanitized = sanitizeClientRequest(snapshot.id, row);
  if (!sanitized) throw new Error('NOT_FOUND');
  return sanitized;
}

export async function readClientRequests(request: NextRequest, orgId: string, projectId?: string) {
  const session = await sessionFor(request);
  if (!orgId || !(await orgAccess(orgId, session.uid))) throw new Error('FORBIDDEN');
  if (projectId) {
    const project = await adminDb!.collection('portal_projects').doc(projectId).get();
    if (!project.exists || project.data()?.orgId !== orgId) throw new Error('NOT_FOUND');
  }
  let query = adminDb!.collection('portal_requests').where('orgId', '==', orgId);
  if (projectId) query = query.where('projectId', '==', projectId);
  // Explicitly bounded; clients don't need unbounded database dumps.
  const page = await query.limit(1001).get();
  if (page.size > 1000) throw new Error('RESULT_LIMIT_EXCEEDED');
  return page.docs
    .map(doc => sanitizeClientRequest(doc.id, doc.data()))
    .filter((item): item is StoredRequest => item !== null)
    .sort((a, b) => {
      const seconds = (v: StoredRequest) =>
        (v.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
      return seconds(b) - seconds(a);
    });
}
