import { afterEach, describe, expect, it, vi } from 'vitest';
import { sandboxPing } from '@/lib/mcp/sandbox-probe';

const HEALTH = {
  ok: true,
  service: 'ai-docker-mobile-probe',
  stage: 'cloud-only',
  dockerConnected: false,
};

describe('CartShift MCP sandbox_ping cloud probe', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('proves only the cloud probe is reachable (not Docker)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(HEALTH), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const result = await sandboxPing();
    expect(result).toEqual({
      reachable: true,
      mode: 'cloud-only',
      dockerConnected: false,
      upstreamResponse: HEALTH,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toBe('https://ai-docker-mobile-probe.vercel.app/api/health');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'GET', cache: 'no-store', redirect: 'error' });
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
  });

  it('rejects forged Docker connectivity or unexpected response data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ...HEALTH, dockerConnected: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));
    await expect(sandboxPing()).resolves.toMatchObject({
      reachable: false, dockerConnected: false,
      error: 'unexpected_upstream_response',
    });
  });

  it('fails closed on upstream HTTP errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('service unavailable', { status: 503 }),
    ));
    await expect(sandboxPing()).resolves.toMatchObject({
      reachable: false, dockerConnected: false,
      error: 'upstream_http_error', httpStatus: 503,
    });
  });

  it('fails closed on network errors and timeouts', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')));
    await expect(sandboxPing()).resolves.toMatchObject({
      reachable: false, dockerConnected: false,
      error: 'network_or_timeout',
    });
  });
});
