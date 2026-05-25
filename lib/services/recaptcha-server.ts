export async function verifyRecaptchaToken(
  captchaToken: string,
  secretKey: string
): Promise<boolean> {
  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(captchaToken)}`;
  const captchaRes = await fetch(verifyUrl, { method: 'POST' });
  const captchaData = (await captchaRes.json()) as { success?: boolean };
  return Boolean(captchaData.success);
}
