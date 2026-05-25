import { vi } from 'vitest';

export const dnsLookupMock = vi.fn();

export function lookup(
  ...args: Parameters<typeof import('node:dns/promises').lookup>
): ReturnType<typeof import('node:dns/promises').lookup> {
  return dnsLookupMock(...args);
}
