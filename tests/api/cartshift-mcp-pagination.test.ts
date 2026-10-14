import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  orgGet: vi.fn(),
  scope: vi.fn(),
  sort: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  get: vi.fn(),
}));

vi.mock('@/lib/firebase-admin', () => {
  const query = {
    orderBy: (...args: unknown[]) => { mocks.sort(...args); return query; },
    limit: (n: number) => { mocks.limit(n); return query; },
    startAfter: (cursor: string) => { mocks.startAfter(cursor); return query; },
    get: () => mocks.get(),
  };
  return {
    adminDb: {
      collection: (name: string) => ({
        doc: () => ({ get: name === 'portal_organizations' ? mocks.orgGet : vi.fn() }),
        where: (...args: unknown[]) => { mocks.scope(...args); return query; },
      }),
    },
  };
});

import { callTool, TOOL_DEFS } from '@/lib/mcp/tools';

const grant = {
  uid: 'agency-user', clientId: 'chatgpt-client',
  scope: ['work:read'],
  resource: 'https://portal.cart-shift.com/api/cartshift-mcp/mcp',
  expiresAt: Date.now() + 60_000,
};

const item = (id: string) => ({
  id,
  data: () => ({
    orgId: 'arava_org', title: id, description: id + ' description',
    status: 'NEW', priority: 'NORMAL', type: 'feature',
  }),
});

describe('MCP scoped work-item pagination', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.orgGet.mockResolvedValue({ exists: true, data: () => ({ status: 'active' }) });
  });

  it('advertises bounded paging arguments on existing tool', () => {
    const definition = TOOL_DEFS.find(x => x.name === 'list_work_items');
    expect(definition?.inputSchema.properties).toHaveProperty('page_size');
    expect(definition?.inputSchema.properties).toHaveProperty('cursor');
  });

  it('retrieves one stable page and returns a cursor without silently truncating', async () => {
    mocks.get.mockResolvedValue({ docs: [item('request_a'), item('request_b'), item('request_c')] });
    const result = await callTool('list_work_items',
      { org_id: 'arava_org', page_size: 2 }, grant) as {
        items: Array<{ id: string }>; truncated: boolean; next_cursor: string | null;
      };
    expect(result.items.map(x => x.id)).toEqual(['request_a', 'request_b']);
    expect(result.truncated).toBe(true);
    expect(result.next_cursor).toBe('request_b');
    expect(mocks.scope).toHaveBeenCalledWith('orgId', '==', 'arava_org');
    expect(mocks.sort).toHaveBeenCalledOnce();
    expect(mocks.limit).toHaveBeenCalledWith(3);
    expect(mocks.startAfter).not.toHaveBeenCalled();
  });

  it('continues after the previous cursor and completes the final page', async () => {
    mocks.get.mockResolvedValue({ docs: [item('request_c')] });
    const result = await callTool('list_work_items',
      { org_id: 'arava_org', cursor: 'request_b', page_size: 2 }, grant) as {
        items: Array<{ id: string }>; truncated: boolean; next_cursor: string | null;
      };
    expect(result.items.map(x => x.id)).toEqual(['request_c']);
    expect(result.truncated).toBe(false);
    expect(result.next_cursor).toBeNull();
    expect(mocks.startAfter).toHaveBeenCalledWith('request_b');
  });

  it('rejects malformed cursors and unbounded page sizes before any Firestore query', async () => {
    await expect(callTool('list_work_items',
      { org_id: 'arava_org', cursor: '../other_org' }, grant)).rejects.toThrow();
    await expect(callTool('list_work_items',
      { org_id: 'arava_org', page_size: 1000 }, grant)).rejects.toThrow();
    expect(mocks.scope).not.toHaveBeenCalled();
  });

  it('requires work read scope before touching organization data', async () => {
    await expect(callTool('list_work_items',
      { org_id: 'arava_org' }, { ...grant, scope: [] })).rejects.toThrow('INSUFFICIENT_SCOPE');
    expect(mocks.orgGet).not.toHaveBeenCalled();
  });
});
