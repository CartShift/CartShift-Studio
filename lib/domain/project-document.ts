import type { ClientProject, ProjectCollectionField } from '@/lib/types/project';

/**
 * Compatibility adapter for projects created before collection fields existed.
 * A missing array is equivalent to no entries; corrupt non-array data is not.
 * Never persist these defaults just by reading a project.
 */
const PROJECT_COLLECTIONS = [
  'stages', 'blockers', 'deliverables', 'launchChecks',
  'inputs', 'workLogs', 'updates', 'changes',
] as const satisfies readonly ProjectCollectionField[];

const DEFAULT_SCOPE = { minHours: 0, maxHours: 0, rateCents: 0, currency: 'ILS' as const };

export function normalizeProjectSnapshot(snapshot: {
  id: string;
  data: () => unknown;
}): ClientProject {
  const value = snapshot.data();
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid project document');
  }
  const stored = value as Record<string, unknown>;
  if (typeof stored.orgId !== 'string' || !stored.orgId ||
      typeof stored.title !== 'string') {
    throw new Error('Invalid project identity');
  }

  const collections: Record<string, unknown> = {};
  for (const field of PROJECT_COLLECTIONS) {
    const current = stored[field];
    if (current !== undefined && !Array.isArray(current)) {
      throw new Error('Invalid project collection: ' + field);
    }
    collections[field] = current ?? [];
  }

  const revisions = stored.reviewRevisions;
  if (revisions !== undefined &&
      (!revisions || typeof revisions !== 'object' || Array.isArray(revisions))) {
    throw new Error('Invalid project review revision registry');
  }

  const scope = stored.scope;
  if (scope !== undefined &&
      (!scope || typeof scope !== 'object' || Array.isArray(scope))) {
    throw new Error('Invalid project scope');
  }

  return {
    ...stored,
    ...collections,
    id: snapshot.id, // Document identity, never a field-controlled ID.
    summary: typeof stored.summary === 'string' ? stored.summary : '',
    nextStep: typeof stored.nextStep === 'string' ? stored.nextStep : '',
    reviewRevisions: (revisions as Record<string, number> | undefined) ?? {},
    scope: scope ? { ...DEFAULT_SCOPE, ...scope } : { ...DEFAULT_SCOPE },
  } as ClientProject;
}
