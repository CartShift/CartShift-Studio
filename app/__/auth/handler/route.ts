import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase Auth Handler Proxy
 *
 * When using a custom domain as the Firebase authDomain (e.g., cart-shift.com instead of
 * cartshiftstudio.firebaseapp.com), Firebase Auth popup/redirect flows need to access
 * the /__/auth/handler endpoint on that custom domain.
 *
 * This route proxies requests to Firebase's auth handler at the original firebaseapp.com domain.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build the Firebase auth handler URL
  const firebaseAuthUrl = new URL(
    'https://cartshiftstudio.firebaseapp.com/__/auth/handler'
  );

  // Forward all query parameters
  searchParams.forEach((value, key) => {
    firebaseAuthUrl.searchParams.set(key, value);
  });

  // Fetch the auth handler page from Firebase
  try {
    const response = await fetch(firebaseAuthUrl.toString(), {
      headers: {
        // Forward relevant headers
        'Accept': request.headers.get('Accept') || 'text/html',
        'User-Agent': request.headers.get('User-Agent') || '',
      },
    });

    // Get the response body
    const body = await response.text();

    // Return the response with appropriate headers
    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Firebase auth handler proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy auth request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Build the Firebase auth handler URL
  const firebaseAuthUrl = new URL(
    'https://cartshiftstudio.firebaseapp.com/__/auth/handler'
  );

  // Forward all query parameters
  searchParams.forEach((value, key) => {
    firebaseAuthUrl.searchParams.set(key, value);
  });

  try {
    // Get the request body
    const body = await request.text();

    const response = await fetch(firebaseAuthUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/x-www-form-urlencoded',
        'Accept': request.headers.get('Accept') || 'text/html',
        'User-Agent': request.headers.get('User-Agent') || '',
      },
      body: body,
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Firebase auth handler proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy auth request' },
      { status: 500 }
    );
  }
}
