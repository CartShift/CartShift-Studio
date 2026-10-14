import type {
  ClientProject, ProjectCollectionField, ProjectCollectionItem,
} from '@/lib/types/project';

/**
 * Pure project collection mutations. Firestore transactions own concurrency;
 * these functions own item identity and review-revision invariants.
 *
 * Keep this independent of Firebase SDKs so it can be tested without credentials.
 */
export type ProjectCollectionDocument =
  Partial<Pick<ClientProject, ProjectCollectionField | 'reviewRevisions'>>;

type Patch<K extends ProjectCollectionField> =
  Record<K, ProjectCollectionItem[K][]> & { reviewRevisions?: Record<string, number> };

function currentItems<K extends ProjectCollectionField>(
  project: ProjectCollectionDocument, field: K
): ProjectCollectionItem[K][] {
  const value = project[field];
  if (value === undefined) return []; // Legacy projects may omit newer collections.
  if (!Array.isArray(value)) throw new Error('Invalid project collection');
  return value as ProjectCollectionItem[K][];
}

function reviewRevisions(project: ProjectCollectionDocument): Record<string, number> {
  const values = project.reviewRevisions;
  if (!values) return {};
  if (typeof values !== 'object' || Array.isArray(values)) {
    throw new Error('Invalid review revisions');
  }
  return values;
}

function assertValidItem(item: { id: string }) {
  if (!item.id || !item.id.trim()) throw new Error('Project item must have an identifier');
}

function assertRevision(value: number) {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error('Review revision must be a positive integer');
  }
}

export function appendProjectCollectionItem<K extends ProjectCollectionField>(
  project: ProjectCollectionDocument, field: K, item: ProjectCollectionItem[K]
): Patch<K> {
  assertValidItem(item);
  const items = currentItems(project, field);
  if (items.some(existing => existing.id === item.id)) {
    throw new Error('Project item already exists');
  }

  const patch = { [field]: [...items, item] } as Patch<K>;
  if (field === 'deliverables') {
    const deliverable = item as ProjectCollectionItem['deliverables'];
    assertRevision(deliverable.revision);
    patch.reviewRevisions = {
      ...reviewRevisions(project), [deliverable.id]: deliverable.revision,
    };
  } else if (field === 'changes') {
    patch.reviewRevisions = {
      ...reviewRevisions(project), ['change:' + item.id]: 1,
    };
  }
  return patch;
}

export function editProjectCollectionItem<K extends ProjectCollectionField>(
  project: ProjectCollectionDocument,
  field: K,
  itemId: string,
  edit: (item: ProjectCollectionItem[K]) => ProjectCollectionItem[K]
): Patch<K> {
  const items = currentItems(project, field);
  const previous = items.find(item => item.id === itemId);
  if (!previous) throw new Error('Item not found');

  // Called inside a Firestore transaction so the edit sees the latest snapshot.
  const changed = edit(previous);
  assertValidItem(changed);
  if (changed.id !== itemId) throw new Error('Project item identifier cannot change');

  const patch = {
    [field]: items.map(item => item.id === itemId ? changed : item),
  } as Patch<K>;

  if (field === 'deliverables') {
    const next = changed as ProjectCollectionItem['deliverables'];
    const before = previous as ProjectCollectionItem['deliverables'];
    assertRevision(next.revision);
    if (next.revision < before.revision) {
      throw new Error('Review revision cannot be reduced');
    }
    patch.reviewRevisions = {
      ...reviewRevisions(project), [itemId]: next.revision,
    };
  }
  return patch;
}
