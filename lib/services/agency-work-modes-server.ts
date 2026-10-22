import 'server-only';
import type { NextRequest } from 'next/server';
import * as admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { requireAgencySession } from '@/lib/auth/server-agency';
import type { WorkMode } from '@/lib/domain/work-engagement';
import { normalizeWorkMode } from '@/lib/domain/work-engagement';

const META = 'agency_client_metadata';
const AUDIT = 'agency_work_mode_audit';

async function requireManager(request: NextRequest): Promise<string> {
  const session = await requireAgencySession(request);
  const snapshot = await adminDb!.collection('portal_users').doc(session.uid).get();
  const role = snapshot.data()?.agencyRole ?? 'owner';
  if (!['owner', 'admin'].includes(role)) throw new Error('FORBIDDEN');
  return session.uid;
}

export async function listAgencyWorkModes(request: NextRequest) {
  await requireAgencySession(request);
  const db = adminDb!;
  const orgId = new URL(request.url).searchParams.get('orgId');
  if (orgId) {
    const org = await db.collection('portal_organizations').doc(orgId).get();
    if (!org.exists || org.data()?.removedAt) throw new Error('NOT_FOUND');
    const snap = await db.collection(META).doc(orgId).get();
    const data = snap.data();
    return {
      orgId,
      defaultWorkMode: normalizeWorkMode(data?.defaultWorkMode),
      internalRelationshipNote: typeof data?.internalRelationshipNote === 'string' ? data.internalRelationshipNote : '',
    };
  }
  const snaps = await db.collection(META).limit(500).get();
  return { modes: snaps.docs.map(doc => ({
    orgId: doc.id,
    defaultWorkMode: normalizeWorkMode(doc.data().defaultWorkMode),
  })) };
}

export async function saveAgencyWorkMode(
  request: NextRequest,
  input: { orgId: string; defaultWorkMode: WorkMode; internalRelationshipNote?: string },
) {
  const uid = await requireManager(request);
  const db = adminDb!;
  const ref = db.collection(META).doc(input.orgId);
  await db.runTransaction(async tx => {
    const [org, previous] = await Promise.all([
      tx.get(db.collection('portal_organizations').doc(input.orgId)),
      tx.get(ref),
    ]);
    if (!org.exists || org.data()?.removedAt) throw new Error('NOT_FOUND');
    const old = previous.data();
    const next = {
      defaultWorkMode: input.defaultWorkMode,
      internalRelationshipNote: input.internalRelationshipNote ?? old?.internalRelationshipNote ?? '',
      updatedBy: uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    tx.set(ref, next, { merge: true });
    tx.create(db.collection(AUDIT).doc(), {
      actorUid: uid, action: 'client_default_work_mode',
      orgId: input.orgId,
      previousMode: normalizeWorkMode(old?.defaultWorkMode),
      nextMode: input.defaultWorkMode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { orgId: input.orgId, defaultWorkMode: input.defaultWorkMode };
}

export async function saveProjectWorkMode(
  request: NextRequest,
  input: { orgId: string; projectId: string; workMode: WorkMode },
) {
  const uid = await requireManager(request);
  const db = adminDb!;
  const ref = db.collection('portal_projects').doc(input.projectId);
  await db.runTransaction(async tx => {
    const project = await tx.get(ref);
    const stored = project.data();
    if (!project.exists || stored?.orgId !== input.orgId) throw new Error('NOT_FOUND');
    const prior = normalizeWorkMode(stored.workMode);
    if (prior === input.workMode && stored.workMode === input.workMode) return;
    // Never silently reinterpret a project carrying commercial documents.
    const related = await tx.get(db.collection('portal_requests')
      .where('projectId', '==', input.projectId).limit(200));
    if (related.size >= 200) throw new Error('TOO_MANY_REQUESTS');
    const hasCommercial = related.docs.some(doc => {
      const item = doc.data();
      return item.isBillable === true || Boolean(item.publicToken) ||
        item.requestRole === 'bundle' || item.requestRole === 'bundle_item' ||
        Number(item.amountPaid || 0) > 0;
    });
    if (input.workMode === 'pro_bono' && hasCommercial) throw new Error('EXISTING_COMMERCIAL_WORK');
    // A completed pro-bono project is not a retroactive commercial engagement.
    if (prior === 'pro_bono' && input.workMode === 'commercial' &&
        (related.size > 0 || stored.status !== 'planning')) {
      throw new Error('CREATE_NEW_COMMERCIAL_PROJECT');
    }
    tx.update(ref, {
      workMode: input.workMode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.create(db.collection(AUDIT).doc(), {
      actorUid: uid, action: 'project_work_mode',
      orgId: input.orgId, projectId: input.projectId,
      previousMode: prior, nextMode: input.workMode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { projectId: input.projectId, workMode: input.workMode };
}
