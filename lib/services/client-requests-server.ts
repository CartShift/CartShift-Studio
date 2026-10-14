import 'server-only';

import { adminDb } from '@/lib/firebase-admin';
import { getServerSession } from '@/lib/auth/server-auth';
import type { NextRequest } from 'next/server';
import { sanitizeClientRequest, type StoredRequest } from '@/lib/domain/client-request-visibility';

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
    !['inactive', 'suspended'].includes(org.data()?.status) &&
    (org.data()?.createdBy === uid || (member.exists && !member.data()?.removedAt));
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
