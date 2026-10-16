/**
 * Strict redirect-URI allowlist for the Google Calendar OAuth code exchange.
 * Google credentials are only minted for a callback we control.
 */
export function validateGoogleRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return false;
    if (parsed.pathname !== '/portal/oauth-callback') return false;
    const allowed = [
      'https://cart-shift.com',
      'https://www.cart-shift.com',
      'https://portal.cart-shift.com',
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
      ...(process.env.GOOGLE_OAUTH_ALLOWED_ORIGINS || '').split(',').map(v => v.trim()).filter(Boolean),
    ];
    return allowed.includes(parsed.origin);
  } catch {
    return false;
  }
}
