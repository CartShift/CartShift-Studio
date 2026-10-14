import {
  addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, where,
  runTransaction, serverTimestamp, setDoc, updateDoc, type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirestoreDb, waitForAuth } from '@/lib/firebase';
import type {
  ClientProject, ProjectCollectionField, ProjectCollectionItem,
  ProjectReview, ProjectReviewDecision, ProjectScope, ProjectStatus, ProjectTemplate,
} from '@/lib/types/project';
import { buildProjectTemplate } from '@/lib/utils/project-workflow';
import { appendProjectCollectionItem, editProjectCollectionItem } from '@/lib/domain/project-collection-patches';
import { normalizeProjectSnapshot } from '@/lib/domain/project-document';

const COLLECTION = 'portal_projects';

const mapProject = normalizeProjectSnapshot;

export async function listClientProjects(orgId?: string): Promise<ClientProject[]> {
  await waitForAuth();
  const db = getFirestoreDb();
  const source = orgId
    ? query(collection(db, COLLECTION), where('orgId', '==', orgId))
    : collection(db, COLLECTION);
  const snapshot = await getDocs(source);
  return snapshot.docs.map(mapProject).sort((a, b) =>
    (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
  );
}

export async function getClientProject(id: string): Promise<ClientProject | null> {
  await waitForAuth();
  const snapshot = await getDoc(doc(getFirestoreDb(), COLLECTION, id));
  return snapshot.exists() ? mapProject(snapshot) : null;
}

export async function createClientProject(input: {
  orgId: string;
  title: string;
  template: ProjectTemplate;
  locale?: 'en' | 'he';
  summary?: string;
}): Promise<string> {
  await waitForAuth();
  const user = getFirebaseAuth().currentUser;
  if (!user || !input.orgId || !input.title.trim()) throw new Error('Missing project details');
  const initial = buildProjectTemplate(input.template, input.locale || 'en');
  const reference = await addDoc(collection(getFirestoreDb(), COLLECTION), {
    orgId: input.orgId,
    title: input.title.trim(),
    template: input.template,
    summary: input.summary?.trim() || '',
    nextStep: '',
    status: 'planning' as ProjectStatus,
    ...initial,
    blockers: [],
    deliverables: [],
    workLogs: [],
    changes: [],
    updates: [],
    reviewRevisions: {},
    scope: { minHours: 0, maxHours: 0, rateCents: 0, currency: 'ILS' } satisfies ProjectScope,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return reference.id;
}

/** Privileged transition; the server re-evaluates project blockers and approvals. */
export async function markClientProjectReady(id: string): Promise<void> {
  await waitForAuth();
  const token = await getFirebaseAuth().currentUser?.getIdToken();
  if (!token) throw new Error('UNAUTHENTICATED');
  const response = await fetch('/api/portal/projects/' + encodeURIComponent(id) + '/ready', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Unable to mark project ready');
  }
}

export async function updateClientProject(
  id: string,
  changes: Partial<Pick<ClientProject, 'title' | 'summary' | 'nextStep' | 'status' | 'scope'>>
): Promise<void> {
  await waitForAuth();
  await updateDoc(doc(getFirestoreDb(), COLLECTION, id), {
    ...changes, updatedAt: serverTimestamp(),
  });
}

// Transactional item writes prevent concurrent client/team edits from overwriting each other.
export async function addProjectItem<K extends ProjectCollectionField>(
  id: string, field: K, item: ProjectCollectionItem[K]
): Promise<void> {
  await waitForAuth();
  const ref = doc(getFirestoreDb(), COLLECTION, id);
  await runTransaction(getFirestoreDb(), async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Project not found');
    const fields = appendProjectCollectionItem(snapshot.data(), field, item);
    transaction.update(ref, {
      ...fields,
      updatedAt: serverTimestamp(),
      ...((snapshot.data().status === 'ready_to_launch' && field !== 'workLogs' && field !== 'updates')
        ? { status: 'in_progress' } : {}),
    });
  });
}

export async function editProjectItem<K extends ProjectCollectionField>(
  id: string, field: K, itemId: string, edit: (item: ProjectCollectionItem[K]) => ProjectCollectionItem[K]
): Promise<void> {
  await waitForAuth();
  const ref = doc(getFirestoreDb(), COLLECTION, id);
  await runTransaction(getFirestoreDb(), async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('Project not found');
    const fields = editProjectCollectionItem(snapshot.data(), field, itemId, edit);
    transaction.update(ref, {
      ...fields,
      updatedAt: serverTimestamp(),
      ...((snapshot.data().status === 'ready_to_launch' && field !== 'workLogs' && field !== 'updates')
        ? { status: 'in_progress' } : {}),
    });
  });
}

export function observeClientProject(
  id: string, update: (project: ClientProject | null) => void,
  failure: (error: Error) => void
): Unsubscribe {
  return onSnapshot(doc(getFirestoreDb(), COLLECTION, id),
    snapshot => update(snapshot.exists() ? mapProject(snapshot) : null), failure);
}

export async function listProjectReviews(projectId: string): Promise<ProjectReview[]> {
  await waitForAuth();
  const snapshot = await getDocs(collection(getFirestoreDb(), COLLECTION, projectId, 'reviews'));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }) as ProjectReview);
}

// Project change-order decisions reuse the same versioned, audited review collection.
export async function submitChangeOrderDecision(input: {
  project: ClientProject;
  changeId: string;
  decision: ProjectReviewDecision;
  comment: string;
}): Promise<void> {
  await waitForAuth();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Authentication required');
  if (!input.project.changes.some(change => change.id === input.changeId)) {
    throw new Error('Change request no longer exists');
  }
  const deliverableId = 'change:' + input.changeId;
  const ref = doc(getFirestoreDb(), COLLECTION, input.project.id, 'reviews',
    deliverableId + '_' + user.uid);
  await setDoc(ref, {
    projectId: input.project.id,
    orgId: input.project.orgId,
    deliverableId,
    reviewerId: user.uid,
    revision: 1,
    decision: input.decision,
    comment: input.comment.trim().slice(0, 3000),
    updatedAt: serverTimestamp(),
  });
}

export async function submitProjectReview(input: {
  project: ClientProject;
  deliverableId: string;
  revision: number;
  decision: ProjectReviewDecision;
  comment: string;
}): Promise<void> {
  await waitForAuth();
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Authentication required');
  const deliverable = input.project.deliverables.find(d => d.id === input.deliverableId);
  if (!deliverable || deliverable.revision !== input.revision) {
    throw new Error('This review version is no longer current');
  }
  const ref = doc(getFirestoreDb(), COLLECTION, input.project.id, 'reviews',
    input.deliverableId + '_' + user.uid);
  await setDoc(ref, {
    projectId: input.project.id,
    orgId: input.project.orgId,
    deliverableId: input.deliverableId,
    reviewerId: user.uid,
    revision: input.revision,
    decision: input.decision,
    comment: input.comment.trim().slice(0, 3000),
    updatedAt: serverTimestamp(),
  });
}
