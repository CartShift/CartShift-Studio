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
  { uid: string; email?: string } | null | undefined
> {
  if (!adminAuth) return undefined;

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME)?.value;
    const bearerToken = request?.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!session && !bearerToken) return null;

    const decoded = session
      ? await adminAuth.verifySessionCookie(session, true)
      : await adminAuth.verifyIdToken(bearerToken!, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
