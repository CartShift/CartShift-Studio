import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  'metadata.google',
]);

const BLOCKED_HOSTNAME_SUFFIXES = ['.local', '.internal', '.localhost'];

export type StoreUrlValidationResult =
  | { ok: true; normalizedUrl: string }
  | { ok: false; error: string };

function isPrivateIpv4(a: number, b: number): boolean {
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  return false;
}

function isPrivateIpAddress(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  if (normalized === '::1') return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  const version = isIP(normalized);
  if (version !== 4) return false;

  const parts = normalized.split('.').map(part => Number(part));
  if (parts.length !== 4 || parts.some(part => Number.isNaN(part))) return true;

  return isPrivateIpv4(parts[0], parts[1]);
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');

  if (BLOCKED_HOSTNAMES.has(host)) return true;
  if (BLOCKED_HOSTNAME_SUFFIXES.some(suffix => host.endsWith(suffix))) return true;
  if (host.endsWith('.metadata.google.internal')) return true;

  const ipVersion = isIP(host);
  if (ipVersion === 4 || ipVersion === 6) {
    return isPrivateIpAddress(host);
  }

  return false;
}

async function resolveHostname(hostname: string): Promise<string[]> {
  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    return records.map(record => record.address);
  } catch {
    return [];
  }
}

export function normalizeStoreUrlInput(storeUrl: string): string {
  const trimmed = storeUrl.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

export async function validateStoreUrlForAnalysis(
  storeUrl: string
): Promise<StoreUrlValidationResult> {
  const normalizedUrl = normalizeStoreUrlInput(storeUrl);

  if (!normalizedUrl) {
    return { ok: false, error: 'Store URL is required.' };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(normalizedUrl);
  } catch {
    return {
      ok: false,
      error: 'Invalid URL format. Please enter a valid store URL (e.g., https://example.com).',
    };
  }

  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    return { ok: false, error: 'Invalid URL protocol. Only HTTP and HTTPS are supported.' };
  }

  const hostname = urlObj.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, error: 'Invalid store URL hostname.' };
  }

  if (isBlockedHostname(hostname)) {
    return {
      ok: false,
      error: 'Invalid store URL. Localhost and internal URLs are not allowed.',
    };
  }

  const ipVersion = isIP(hostname);
  if (ipVersion === 0) {
    const resolvedAddresses = await resolveHostname(hostname);
    if (resolvedAddresses.length === 0) {
      return {
        ok: false,
        error: 'Could not resolve store hostname. Please check the URL.',
      };
    }

    if (resolvedAddresses.some(address => isPrivateIpAddress(address))) {
      return {
        ok: false,
        error: 'Invalid store URL. Private or internal network addresses are not allowed.',
      };
    }
  }

  return { ok: true, normalizedUrl };
}
