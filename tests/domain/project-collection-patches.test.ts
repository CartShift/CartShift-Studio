import { describe, expect, it } from 'vitest';
import {
  appendProjectCollectionItem, editProjectCollectionItem,
} from '@/lib/domain/project-collection-patches';

describe('project collection transaction payloads', () => {
  it('appends legacy project collections without modifying the input document', () => {
    const old = { reviewRevisions: { hero: 2 } };
    const patch = appendProjectCollectionItem(old, 'workLogs', {
      id: 'log-1', note: 'Checked mixed inventory', hours: 1.25, createdAt: 123,
    });
    expect(patch).toEqual({
      workLogs: [{ id: 'log-1', note: 'Checked mixed inventory', hours: 1.25, createdAt: 123 }],
    });
    expect(old).toEqual({ reviewRevisions: { hero: 2 } });
  });

  it('rejects duplicate item IDs instead of silently overwriting document entries', () => {
    const project = { inputs: [{ id: 'input-1', title: 'Assets', required: true, done: false }] };
    expect(() => appendProjectCollectionItem(project, 'inputs', {
      id: 'input-1', title: 'Duplicate', required: false, done: true,
    })).toThrow('already exists');
  });

  it('preserves unrelated review revisions while appending a deliverable', () => {
    const patch = appendProjectCollectionItem(
      { deliverables: [], reviewRevisions: { old: 4, 'change:extra': 1 } },
      'deliverables',
      { id: 'hero', title: 'Hero review', revision: 2 }
    );
    expect(patch.reviewRevisions).toEqual({
      old: 4, 'change:extra': 1, hero: 2,
    });
  });

  it('registers change review identifiers without clobbering deliverable revisions', () => {
    const patch = appendProjectCollectionItem(
      { reviewRevisions: { hero: 3 } }, 'changes',
      { id: 'extra', title: 'Extra work', description: '', estimatedHours: 1, status: 'proposed' }
    );
    expect(patch.reviewRevisions).toEqual({ hero: 3, 'change:extra': 1 });
  });

  it('edits a single entry and increments the matching review revision', () => {
    const first = { id: 'hero', title: 'Hero', revision: 1 };
    const second = { id: 'footer', title: 'Footer', revision: 4 };
    const project = { deliverables: [first, second], reviewRevisions: { hero: 1, footer: 4 } };
    const patch = editProjectCollectionItem(project, 'deliverables', 'hero', old => ({
      ...old, revision: old.revision + 1,
    }));
    expect(patch.deliverables).toEqual([{ ...first, revision: 2 }, second]);
    expect(patch.reviewRevisions).toEqual({ hero: 2, footer: 4 });
    expect(project.deliverables[0].revision).toBe(1);
  });

  it('rejects editing a missing item or changing an existing identifier', () => {
    const project = { stages: [{ id: 's-1', title: 'QA', status: 'pending' as const }] };
    expect(() => editProjectCollectionItem(project, 'stages', 'missing', old => old))
      .toThrow('Item not found');
    expect(() => editProjectCollectionItem(project, 'stages', 's-1', old => ({
      ...old, id: 's-2',
    }))).toThrow('identifier');
  });

  it('rejects invalid review revisions and regression to an earlier version', () => {
    const project = {
      deliverables: [{ id: 'hero', title: 'Hero', revision: 3 }],
      reviewRevisions: { hero: 3 },
    };
    expect(() => editProjectCollectionItem(project, 'deliverables', 'hero', old => ({
      ...old, revision: 2,
    }))).toThrow('cannot be reduced');
    expect(() => appendProjectCollectionItem({}, 'deliverables', {
      id: 'new', title: 'Review', revision: 0,
    })).toThrow('positive integer');
  });

  it('treats broken collection shapes as errors rather than overwriting data', () => {
    const project = { workLogs: 'wrong type' } as never;
    expect(() => appendProjectCollectionItem(project, 'workLogs', {
      id: 'log', hours: 2, note: '', createdAt: 123,
    })).toThrow('Invalid project collection');
  });
});
