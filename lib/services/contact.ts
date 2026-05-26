import { env } from '@/lib/env';
import { validateContactForm, type ContactFormData } from '@/lib/validation';
import { sanitizeString } from '@/lib/sanitize';
import { logError } from '@/lib/error-handler';
import type { z } from 'zod';

export async function submitContactForm(
  data: unknown
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const validation = validateContactForm(data);

  if (!validation.success) {
    const errorMessages = validation.errors.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    return {
      success: false,
      error: `Invalid form data: ${errorMessages}`,
      status: 400,
    };
  }

  const sanitizedData: ContactFormData = {
    name: sanitizeString(validation.data.name),
    email: sanitizeString(validation.data.email),
    interest: validation.data.interest ? sanitizeString(validation.data.interest) : undefined,
    message: validation.data.message ? sanitizeString(validation.data.message) : undefined,
    company: validation.data.company ? sanitizeString(validation.data.company) : undefined,
    projectType: validation.data.projectType
      ? sanitizeString(validation.data.projectType)
      : undefined,
    locale: validation.data.locale,
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
    const response = await fetch(firebaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedData),
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(
        `Firebase function returned non-JSON response: ${response.status} ${response.statusText}. Response: ${text}`
      );
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Firebase function returned ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    logError('Failed to submit contact form', error, { data: sanitizedData });
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit form. Please try again later.',
      status: 500,
    };
  }
}
