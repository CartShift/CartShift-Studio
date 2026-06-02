import 'server-only';
import type { NextRequest } from 'next/server';

export function isLocalhostHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const hostname = host.split(':')[0]?.toLowerCase() ?? '';
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost');
}

export function isDevPortalAuthEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.PORTAL_DEV_AUTH_ENABLED === 'true' &&
    Boolean(process.env.PORTAL_DEV_AUTH_SECRET?.trim()) &&
    Boolean(process.env.PORTAL_DEV_AUTH_EMAIL?.trim())
  );
}

export function assertDevPortalAuthRequest(request: NextRequest): void {
  if (!isDevPortalAuthEnabled()) {
    throw new DevPortalAuthError('not-found', 404);
  }

  if (!isLocalhostHost(request.headers.get('host'))) {
    throw new DevPortalAuthError('localhost-only', 403);
  }
}

export function verifyDevPortalAuthSecret(secret: unknown): void {
  const expected = process.env.PORTAL_DEV_AUTH_SECRET?.trim();
  if (!expected || typeof secret !== 'string' || secret.trim() !== expected) {
    throw new DevPortalAuthError('invalid-secret', 401);
  }
}

export function getDevPortalAuthEmail(): string {
  const email = process.env.PORTAL_DEV_AUTH_EMAIL?.trim();
  if (!email) {
    throw new DevPortalAuthError('missing-config', 500);
  }
  return email;
}

export class DevPortalAuthError extends Error {
  constructor(
    readonly code: string,
    readonly status: number
  ) {
    super(code);
    this.name = 'DevPortalAuthError';
  }
}
