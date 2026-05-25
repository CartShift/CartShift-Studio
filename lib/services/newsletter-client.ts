import { logError } from '@/lib/logger';

export async function subscribeNewsletter(
  email: string,
  options?: { locale?: 'en' | 'he'; source?: string }
) {
  try {
    const response = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...options }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to subscribe');
    }

    return await response.json();
  } catch (error) {
    logError('Newsletter subscription failed', error);
    throw error;
  }
}
