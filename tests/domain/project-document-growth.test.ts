import { describe, expect, it } from 'vitest';
import {
  inspectProjectDocumentGrowth,
  PROJECT_DOCUMENT_CAUTION_BYTES,
} from '@/lib/domain/project-document-growth';

describe('read-only project document growth diagnostics', () => {
  it('reports zero for missing legacy arrays and never mutates the original', () => {
    const legacy = Object.freeze({ orgId: 'org', title: 'Legacy Shopify work' });
    const growth = inspectProjectDocumentGrowth(legacy);
    expect(growth.caution).toBe(false);
    expect(growth.collectionCounts.workLogs).toBe(0);
    expect(growth.collectionCounts.changes).toBe(0);
    expect(growth.largestEmbeddedCollection).toBeNull();
    expect(legacy).toEqual({ orgId: 'org', title: 'Legacy Shopify work' });
  });

  it('uses UTF-8 JSON size, not JavaScript string length, for Hebrew content', () => {
    const message = 'דיווח עבודה בעברית';
    const growth = inspectProjectDocumentGrowth({ updates: [{ id: 'a', text: message }] });
    const bytes = new TextEncoder().encode(JSON.stringify({ updates: [{ id: 'a', text: message }] })).length;
    expect(growth.estimatedJsonBytes).toBe(bytes);
    expect(growth.estimatedJsonBytes).toBeGreaterThan(JSON.stringify({ updates: [{ id: 'a', text: message }] }).length);
    expect(growth.collectionCounts.updates).toBe(1);
    expect(growth.largestEmbeddedCollection?.field).toBe('updates');
  });

  it('raises an early caution when the estimate approaches the 1 MiB Firestore document limit', () => {
    const growth = inspectProjectDocumentGrowth({
      workLogs: [{ id: 'log', note: 'x'.repeat(PROJECT_DOCUMENT_CAUTION_BYTES) }],
    });
    expect(growth.caution).toBe(true);
    expect(growth.collectionCounts.workLogs).toBe(1);
    expect(growth.estimatedJsonBytes).toBeGreaterThanOrEqual(PROJECT_DOCUMENT_CAUTION_BYTES);
  });

  it('fails instead of hiding malformed embedded collection data', () => {
    expect(() => inspectProjectDocumentGrowth({ changes: { id: 'not-an-array' } }))
      .toThrow('Invalid project collection: changes');
  });
});
