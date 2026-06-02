import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import {
  assertDevPortalAuthRequest,
  DevPortalAuthError,
  getDevPortalAuthEmail,
  verifyDevPortalAuthSecret,
} from '@/lib/dev/portal-auth';
import { ensurePortalOwnerAccess } from '@/lib/dev/ensure-portal-owner';

export async function POST(request: NextRequest) {
  try {
    assertDevPortalAuthRequest(request);

    if (!adminAuth) {
      return NextResponse.json(
        {
          error: 'admin-not-configured',
          message: 'Firebase Admin SDK is required. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    verifyDevPortalAuthSecret(body?.secret);

    const email = getDevPortalAuthEmail();
    const user = await adminAuth.getUserByEmail(email);
    await ensurePortalOwnerAccess(user.uid, email);
    const customToken = await adminAuth.createCustomToken(user.uid);

    return NextResponse.json({
      customToken,
      email: user.email,
      uid: user.uid,
    });
  } catch (error) {
    if (error instanceof DevPortalAuthError) {
      if (error.status === 404) {
        return new NextResponse(null, { status: 404 });
      }
      return NextResponse.json({ error: error.code }, { status: error.status });
    }

    console.error('[dev/portal-auth] Failed to create custom token:', error);
    return NextResponse.json({ error: 'token-creation-failed' }, { status: 500 });
  }
}
