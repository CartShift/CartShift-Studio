import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';

const COOKIE_NAME = '__session';

/**
 * Verifies the session cookie server-side via Firebase Admin SDK.
 * Returns the decoded session if valid, null if no cookie / invalid.
 * Returns undefined if Admin SDK is not configured (graceful degradation for dev).
 */
export async function getServerSession(): Promise<
  { uid: string; email?: string } | null | undefined
> {
  if (!adminAuth) return undefined;

  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(COOKIE_NAME)?.value;
    if (!session) return null;

    const decoded = await adminAuth.verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
