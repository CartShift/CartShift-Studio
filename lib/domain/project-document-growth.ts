import type { ProjectCollectionField } from '@/lib/types/project';

/**
 * A deliberately conservative *diagnostic*, not a Firestore serialized-size calculation.
 * JSON UTF-8 bytes omit Firestore's per-field/protobuf overhead. Use this to
 * identify large project documents; never to approve a write below the 1MiB limit.
 */
export const PROJECT_DOCUMENT_CAUTION_BYTES = 700 * 1024;
const EMBEDDED_COLLECTIONS = [
  'stages', 'blockers', 'deliverables', 'launchChecks',
  'inputs', 'workLogs', 'updates', 'changes',
] as const satisfies readonly ProjectCollectionField[];

const utf8Bytes = (value: unknown) => {
  const json = JSON.stringify(value);
  if (typeof json !== 'string') throw new Error('Cannot estimate non-serializable project data');
  return new TextEncoder().encode(json).byteLength;
};

export interface ProjectDocumentGrowth {
  estimatedJsonBytes: number;
  caution: boolean;
  collectionCounts: Record<ProjectCollectionField, number>;
  largestEmbeddedCollection: { field: ProjectCollectionField; estimatedJsonBytes: number } | null;
}

/** Inspect an already-loaded Firestore project document without changing it. */
export function inspectProjectDocumentGrowth(data: Record<string, unknown>): ProjectDocumentGrowth {
  const estimatedJsonBytes = utf8Bytes(data);
  const collectionCounts = {} as Record<ProjectCollectionField, number>;
  let largestEmbeddedCollection: ProjectDocumentGrowth['largestEmbeddedCollection'] = null;

  for (const field of EMBEDDED_COLLECTIONS) {
    const value = data[field];
    if (value !== undefined && !Array.isArray(value)) {
      throw new Error('Invalid project collection: ' + field);
    }
    const items = (value ?? []) as unknown[];
    collectionCounts[field] = items.length;
    const collectionBytes = utf8Bytes(items);
    if (!largestEmbeddedCollection || collectionBytes > largestEmbeddedCollection.estimatedJsonBytes) {
      largestEmbeddedCollection = { field, estimatedJsonBytes: collectionBytes };
    }
  }

  return {
    estimatedJsonBytes,
    caution: estimatedJsonBytes >= PROJECT_DOCUMENT_CAUTION_BYTES,
    collectionCounts,
    largestEmbeddedCollection,
  };
}
