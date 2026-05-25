import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dnsLookupMock } from '../mocks/node-dns-promises';
import { safeFetchStoreHtml } from '@/lib/utils/safe-store-fetch';

describe('safeFetchStoreHtml', () => {
  beforeEach(() => {
    vi.mocked(dnsLookupMock).mockResolvedValue([
      { address: '93.184.216.34', family: 4 },
    ] as unknown as Awaited<ReturnType<typeof dnsLookupMock>>);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns HTML from a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html><body>ok</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )
    );

    const result = await safeFetchStoreHtml('https://shop.example.com');
    expect(result.html).toContain('ok');
    expect(result.finalUrl).toBe('https://shop.example.com');
  });

  it('validates redirect targets before following', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('', {
          status: 302,
          headers: { Location: 'https://evil.example/landing' },
        })
      )
      .mockResolvedValueOnce(
        new Response('<html>redirected</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      );

    vi.stubGlobal('fetch', fetchMock);

    vi.mocked(dnsLookupMock)
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as unknown as Awaited<
        ReturnType<typeof dnsLookupMock>
      >)
      .mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as unknown as Awaited<
        ReturnType<typeof dnsLookupMock>
      >);

    const result = await safeFetchStoreHtml('https://shop.example.com');
    expect(result.html).toContain('redirected');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects redirects to private networks', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('', {
          status: 302,
          headers: { Location: 'http://127.0.0.1/admin' },
        })
      )
    );

    await expect(safeFetchStoreHtml('https://shop.example.com')).rejects.toThrow(
      /not allowed/i
    );
  });

  it('rejects non-OK HTTP responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('gone', { status: 404 }))
    );

    await expect(safeFetchStoreHtml('https://shop.example.com')).rejects.toThrow(/HTTP 404/);
  });

  it('rejects oversized HTML payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('x'.repeat(5 * 1024 * 1024 + 1), {
          status: 200,
          headers: { 'content-type': 'text/html' },
        })
      )
    );

    await expect(safeFetchStoreHtml('https://shop.example.com')).rejects.toThrow(/too large/i);
  });

  it('rejects redirect chains beyond the limit', async () => {
    let hop = 0;
    const fetchMock = vi.fn().mockImplementation((_url: string) => {
      hop += 1;
      return Promise.resolve(
        new Response('', {
          status: 302,
          headers: { Location: `https://shop.example.com/hop-${hop}` },
        })
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(safeFetchStoreHtml('https://shop.example.com')).rejects.toThrow(
      /too many redirects/i
    );
    expect(fetchMock.mock.calls.length).toBeGreaterThan(5);
  });
});
