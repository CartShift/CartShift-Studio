import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

const SESSION_EXPIRY = 60 * 60 * 24 * 5 * 1000; // 5 days
const COOKIE_NAME = '__session';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!adminAuth) {
      return NextResponse.json({ status: 'skipped', reason: 'admin-not-configured' });
    }

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
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
    return NextResponse.json({ error: 'Session creation failed' }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'success' });
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  return response;
}
