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

const COLLECTION = 'portal_projects';

const mapProject = (snapshot: { id: string; data: () => unknown }): ClientProject =>
  ({ id: snapshot.id, ...(snapshot.data() as object) }) as ClientProject;

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
    const items = (snapshot.data()[field] || []) as ProjectCollectionItem[K][];
    const fields: Record<string, unknown> = {
      [field]: [...items, item],
      updatedAt: serverTimestamp(),
    };
    if (field === 'deliverables' || field === 'changes') {
      const registry = (snapshot.data().reviewRevisions || {}) as Record<string, number>;
      const reviewId = field === 'changes' ? 'change:' + item.id : item.id;
      fields.reviewRevisions = { ...registry, [reviewId]: field === 'changes' ? 1 : (item as ProjectCollectionItem['deliverables']).revision };
    }
    transaction.update(ref, fields);
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
    const items = (snapshot.data()[field] || []) as ProjectCollectionItem[K][];
    if (!items.some(item => item.id === itemId)) throw new Error('Item not found');
    const updated = items.map(item => item.id === itemId ? edit(item) : item);
    const fields: Record<string, unknown> = {
      [field]: updated,
      updatedAt: serverTimestamp(),
    };
    if (field === 'deliverables') {
      const registry = (snapshot.data().reviewRevisions || {}) as Record<string, number>;
      const changed = updated.find(item => item.id === itemId) as ProjectCollectionItem['deliverables'];
      fields.reviewRevisions = { ...registry, [itemId]: changed.revision };
    }
    transaction.update(ref, fields);
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
