import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase Auth Iframe Proxy
 *
 * This route proxies requests to Firebase's auth iframe endpoint.
 * Required for Firebase Auth popup/redirect flows when using a custom authDomain.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build the Firebase auth iframe URL
  const firebaseAuthUrl = new URL('https://cartshiftstudio.firebaseapp.com/__/auth/iframe');

  // Forward all query parameters
  searchParams.forEach((value, key) => {
    firebaseAuthUrl.searchParams.set(key, value);
  });

  try {
    const response = await fetch(firebaseAuthUrl.toString(), {
      headers: {
        Accept: request.headers.get('Accept') || 'text/html',
        'User-Agent': request.headers.get('User-Agent') || '',
      },
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        // Important: Allow framing for Firebase Auth
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error) {
    console.error('Firebase auth iframe proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy auth request' }, { status: 500 });
  }
}
