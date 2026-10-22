import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authorize: vi.fn(), lease: vi.fn(), complete: vi.fn() }));
vi.mock('@/lib/mcp/sandbox-jobs', () => ({ authorizeSandboxWorker: mocks.authorize,
  leaseSandboxJob: mocks.lease, completeSandboxJob: mocks.complete }));
import { POST } from '@/app/api/cartshift-mcp/sandbox/worker/route';

describe('sandbox worker request boundaries', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.authorize.mockReturnValue(true); mocks.complete.mockResolvedValue({ acknowledged: true }); });
  it('rejects unauthenticated callers before accepting payloads', async () => {
    mocks.authorize.mockReturnValue(false);
    const result = await POST(new Request('https://example.com', { method: 'POST', body: '{}' }));
    expect(result.status).toBe(401);
    expect(mocks.lease).not.toHaveBeenCalled();
  });
  it('accepts bounded escaped command output above the old 55KB body limit', async () => {
    const body = JSON.stringify({ action: 'complete', stdout: '\u0001'.repeat(24000) });
    const result = await POST(new Request('https://example.com', { method: 'POST', body, headers: { 'content-length': String(body.length) } }));
    expect(result.status).toBe(200);
    expect(mocks.complete).toHaveBeenCalledOnce();
  });
  it('rejects oversized streamed bodies even without content-length', async () => {
    const body = JSON.stringify({ action: 'complete', stdout: 'x'.repeat(200001) });
    const result = await POST(new Request('https://example.com', { method: 'POST', body }));
    expect(result.status).toBe(413);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
});
