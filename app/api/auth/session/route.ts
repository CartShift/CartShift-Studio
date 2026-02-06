import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_EXPIRY = 60 * 60 * 24 * 5 * 1000; // 5 days
const COOKIE_NAME = '__session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const idToken = body?.idToken;

    if (!adminAuth) {
      return NextResponse.json({ status: 'skipped', reason: 'admin-not-configured' });
    }

    if (!idToken) {
      return NextResponse.json({ status: 'skipped', reason: 'missing-token' });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY,
    });

    const response = NextResponse.json({ status: 'success' });
    response.cookies.set(COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_EXPIRY / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ status: 'error', reason: 'session-creation-failed' });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'success' });
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
