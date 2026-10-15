import { describe, expect, it } from 'vitest';
import { resolveAuditReference } from '@/lib/domain/project-audit-coverage';

describe('bounded project integrity audit coverage', () => {
  const scanned = new Map([
    ['projectA', { orgId: 'orgA', title: 'A' }],
    ['projectB', { orgId: 'orgB', title: 'B' }],
  ]);

  it('recognizes inspected links even if the collection scan stopped at a cap', () => {
    expect(resolveAuditReference('projectA', scanned, false)).toEqual({
      status: 'found', value: { orgId: 'orgA', title: 'A' },
    });
  });

  it('reports missing links only for a complete scan', () => {
    expect(resolveAuditReference('absent', scanned, true)).toEqual({ status: 'missing' });
  });

  it('does not invent broken links when the target collection was truncated', () => {
    expect(resolveAuditReference('absent', scanned, false)).toEqual({ status: 'unverified' });
  });

  it('supports truly empty complete and partial collections', () => {
    expect(resolveAuditReference('old', new Map(), true).status).toBe('missing');
    expect(resolveAuditReference('old', new Map(), false).status).toBe('unverified');
  });
});
