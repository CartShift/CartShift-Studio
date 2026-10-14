import { describe, expect, it } from 'vitest';
import { normalizeProjectSnapshot } from '@/lib/domain/project-document';

describe('legacy project snapshot adaptation', () => {
  it('backfills absent collections without mutating Firestore data', () => {
    const stored = { id: 'untrusted-id', orgId: 'org-1', title: 'Legacy site refresh',
      stages: [{ id: 'stage-1', title: 'QA', status: 'pending' }] };
    const project = normalizeProjectSnapshot({ id: 'trusted-id', data: () => stored });
    expect(project.id).toBe('trusted-id');
    expect(project.stages).toEqual(stored.stages);
    expect(project.workLogs).toEqual([]);
    expect(project.inputs).toEqual([]);
    expect(project.changes).toEqual([]);
    expect(project.reviewRevisions).toEqual({});
    expect(project.scope).toEqual({ minHours: 0, maxHours: 0, rateCents: 0, currency: 'ILS' });
    expect(stored).not.toHaveProperty('scope');
  });

  it('preserves a new project\'s currency, scope and review metadata', () => {
    const stored = { orgId: 'org-1', title: 'Custom integration',
      scope: { minHours: 10, maxHours: 16, rateCents: 25000, currency: 'EUR' },
      reviewRevisions: { hero: 5 }, workLogs: [] };
    const project = normalizeProjectSnapshot({ id: 'project-1', data: () => stored });
    expect(project.scope).toEqual(stored.scope);
    expect(project.reviewRevisions).toEqual({ hero: 5 });
  });

  it('rejects corrupt collection shapes instead of silently losing client data', () => {
    expect(() => normalizeProjectSnapshot({ id: 'a', data: () => ({
      orgId: 'org-1', title: 'Oops', changes: { surprise: true },
    }) })).toThrow('Invalid project collection');
  });

  it('rejects records with invalid tenant scope', () => {
    expect(() => normalizeProjectSnapshot({ id: 'a', data: () => ({
      orgId: '', title: 'Missing owner',
    }) })).toThrow('Invalid project identity');
    expect(() => normalizeProjectSnapshot({ id: 'a', data: () => null }))
      .toThrow('Invalid project document');
  });
});
