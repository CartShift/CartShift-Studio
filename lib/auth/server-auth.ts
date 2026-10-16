import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const COOKIE_NAME = '__session';

/**
 * Verifies the session cookie server-side via Firebase Admin SDK.
 * Returns the decoded session if valid, null if no cookie / invalid.
 * Returns undefined if Admin SDK is not configured (graceful degradation for dev).
 */
export async function getServerSession(request?: NextRequest): Promise<
  { uid: string; email?: string; emailVerified: boolean } | null | undefined
> {
  if (!adminAuth) return undefined;

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME)?.value;
    const bearerToken = request?.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!session && !bearerToken) return null;

    // Fresh Firebase identity takes precedence over a stale session cookie.
    // This also avoids silently serving another previously signed-in account.
    const decoded = bearerToken
      ? await adminAuth.verifyIdToken(bearerToken, true)
      : await adminAuth.verifySessionCookie(session!, true);
    return { uid: decoded.uid, email: decoded.email, emailVerified: decoded.email_verified === true };
  } catch {
    return null;
  }
}
