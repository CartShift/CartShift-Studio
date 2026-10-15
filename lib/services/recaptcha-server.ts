/** Verify Google reCAPTCHA v3 action and score, not just the "success" field. */
export async function verifyRecaptchaToken(
  captchaToken: string,
  secretKey: string,
  expectedAction = 'analyze_store'
): Promise<boolean> {
  if (!captchaToken || !secretKey) return false;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: secretKey, response: captchaToken }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as {
      success?: boolean;
      action?: string;
      score?: number;
      hostname?: string;
    };
    return data.success === true &&
      data.action === expectedAction &&
      typeof data.score === 'number' &&
      Number.isFinite(data.score) &&
      data.score >= 0.5 &&
      (process.env.NODE_ENV !== 'production' ||
        data.hostname === 'cart-shift.com' ||
        data.hostname === 'www.cart-shift.com' ||
        data.hostname === 'portal.cart-shift.com');
  } catch {
    return false;
  }
}
