import { env } from '@/lib/env';
import { validateNewsletterSubscription, type NewsletterSubscriptionData } from '@/lib/validation';
import { sanitizeString } from '@/lib/sanitize';
import { logError } from '@/lib/error-handler';
import { buildFirebaseFunctionUrl } from '@/lib/services/firebase';

export async function subscribeNewsletter(
  data: unknown
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const validation = validateNewsletterSubscription(data);

  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid email address',
      status: 400,
    };
  }

  const sanitizedData: NewsletterSubscriptionData = {
    email: sanitizeString(validation.data.email),
  };

  const firebaseUrl = env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
  if (!firebaseUrl) {
    logError(
      'NEXT_PUBLIC_FIREBASE_FUNCTION_URL is not configured',
      new Error('Missing environment variable')
    );
    return {
      success: false,
      error: 'Configuration error. Please contact support.',
      status: 500,
    };
  }

  try {
    const functionUrl = buildFirebaseFunctionUrl(firebaseUrl, 'newsletterSubscription');
    if (!functionUrl) {
      throw new Error('Invalid Firebase function URL');
    }
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(
        `Firebase function returned non-JSON response: ${response.status} ${response.statusText}`
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Firebase function returned ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    logError('Failed to subscribe to newsletter', error, { data: sanitizedData });
    return {
      success: false,
      error: 'Failed to subscribe. Please try again later.',
      status: 500,
    };
  }
}
