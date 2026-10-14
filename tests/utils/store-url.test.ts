import { describe, expect, it, vi } from 'vitest';
import { dnsLookupMock } from '../mocks/node-dns-promises';
import { normalizeStoreUrlInput, validateStoreUrlForAnalysis } from '@/lib/utils/store-url';
import type { lookup } from 'node:dns/promises';

describe('normalizeStoreUrlInput', () => {
  it('adds https when protocol is missing', () => {
    expect(normalizeStoreUrlInput('example.com')).toBe('https://example.com');
  });

  it('preserves existing protocol', () => {
    expect(normalizeStoreUrlInput('http://example.com')).toBe('http://example.com');
  });
});

describe('validateStoreUrlForAnalysis', () => {
  it('rejects localhost hostnames', async () => {
    const result = await validateStoreUrlForAnalysis('http://localhost/store');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/not allowed/i);
    }
  });

  it('rejects private literal IPs', async () => {
    const result = await validateStoreUrlForAnalysis('https://192.168.1.10');
    expect(result.ok).toBe(false);
  });

  it('rejects hostnames resolving to private IPs', async () => {
    vi.mocked(dnsLookupMock).mockResolvedValueOnce([
      { address: '10.0.0.15', family: 4 },
    ] as unknown as Awaited<ReturnType<typeof lookup>>);

    const result = await validateStoreUrlForAnalysis('https://evil.example');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/private/i);
    }
  });

  it('rejects credentials in storefront URLs', async () => {
    expect((await validateStoreUrlForAnalysis('https://admin:secret@example.com')).ok).toBe(false);
  });

  it('rejects nonstandard ports that could reach arbitrary services', async () => {
    expect((await validateStoreUrlForAnalysis('https://example.com:8080')).ok).toBe(false);
  });

  it('rejects IPv4-mapped IPv6 internal destinations', async () => {
    expect((await validateStoreUrlForAnalysis('http://[::ffff:127.0.0.1]')).ok).toBe(false);
  });

  it('normalizes and safely encodes the URL before it enters a report', async () => {
    vi.mocked(dnsLookupMock).mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
    ] as unknown as Awaited<ReturnType<typeof lookup>>);

    const result = await validateStoreUrlForAnalysis(
      'https://example.com/?q=<script>#private-fragment'
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.normalizedUrl).not.toContain('<script>');
      expect(result.normalizedUrl).not.toContain('#private-fragment');
    }
  });

  it('accepts public store URLs', async () => {
    vi.mocked(dnsLookupMock).mockResolvedValueOnce([
      { address: '93.184.216.34', family: 4 },
    ] as unknown as Awaited<ReturnType<typeof lookup>>);

    const result = await validateStoreUrlForAnalysis('example.com');
    expect(result).toEqual({ ok: true, normalizedUrl: 'https://example.com' });
  });
});
