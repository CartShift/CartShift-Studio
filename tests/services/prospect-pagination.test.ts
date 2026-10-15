import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as Array<{ id: string; doc: Record<string, unknown> }> }));
vi.mock('@/lib/firebase-admin', () => {
  const doc = (name: string, id: string) => ({
    id, path: name + '/' + id,
    get: async () => {
      const item = name === 'portal_users' ?
        (id === 'adi' ? { agencyRole: 'business_development', accountType: 'AGENCY', status: 'active' } : null) :
        state.rows.find(row => row.id === id)?.doc;
      return { exists: Boolean(item), id, data: () => item };
    },
  });
  const buildQuery = (start: string | null = null) => ({
    startAfter: (cursor: { id: string }) => buildQuery(cursor.id),
    limit: (count: number) => ({
      get: async () => {
        const ordered = state.rows.slice().sort((a,b) =>
          Number(b.doc.updatedAt) - Number(a.doc.updatedAt));
        const index = start ? ordered.findIndex(row => row.id === start) + 1 : 0;
        const items = ordered.slice(index, index + count);
        const docs = items.map(row => ({ id: row.id, data: () => row.doc }));
        return { docs, size: docs.length, empty: docs.length === 0 };
      },
    }),
  });
  return { adminDb: {
    collection: (name: string) => ({
      doc: (id: string) => doc(name, id),
      orderBy: () => buildQuery(),
    }),
  } };
});
import { listProspects } from '@/lib/services/prospects-server';

beforeEach(() => {
  state.rows = Array.from({ length: 90 }, (_, i) => ({
    id: 'prospect_' + i.toString(16).padStart(32, '0'),
    doc: {
      canonicalDomain: 'shop' + i + '.co.il', brandName: 'Store ' + i,
      sourceUrl: 'https://shop' + i + '.co.il', updatedAt: 1000 - i,
      researchNote: i % 3 === 0 ? 'needle opportunity' : 'other lead',
      stage: 'needs_review', ownerUid: 'adi',
      ...(i % 9 === 0 ? { archived: true } : {}),
    },
  }));
});

describe('bounded server-driven worklist search and pagination', () => {
  it('finds research-note matches across the full collection, not only the first 60', async () => {
    const result = await listProspects({ query: 'needle', active_only: true, limit: 40 }, 'adi');
    expect(result.prospects.length).toBe(20);
    expect(result.prospects.every(row => row.researchNote.includes('needle') && !row.archived)).toBe(true);
    expect(result.truncated).toBe(false);
  });
  it('uses an exact cursor to retrieve more candidates without repeating earlier records', async () => {
    const first = await listProspects({ limit: 25 }, 'adi');
    expect(first.prospects).toHaveLength(25);
    expect(first.truncated).toBe(true);
    expect(first.nextCursor).toBeTruthy();
    const second = await listProspects({ limit: 25, cursor: first.nextCursor }, 'adi');
    expect(second.prospects).toHaveLength(25);
    expect(new Set([...first.prospects, ...second.prospects].map(row => row.id)).size).toBe(50);
  });
  it('rejects a forged cursor before scanning data', async () => {
    await expect(listProspects({ cursor: 'prospect_' + 'f'.repeat(32) }, 'adi'))
      .rejects.toThrow('INVALID_PAGE_CURSOR');
  });
});
