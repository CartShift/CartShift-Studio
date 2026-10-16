import { validateContactForm, type ContactFormData } from '@/lib/validation';
import { sanitizeString } from '@/lib/sanitize';
import { logError } from '@/lib/error-handler';
import { persistContactInquiry } from '@/lib/services/contact-server';
import type { z } from 'zod';

/**
 * Contact form is handled entirely in the Next.js backend.
 * The Firestore transaction creates a durable email job instead of performing
 * a second HTTP hop to an unauthenticated Firebase Function.
 */
export async function submitContactForm(
  data: unknown
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  const validation = validateContactForm(data);
  if (!validation.success) {
    return {
      success: false,
      error: validation.errors.issues.map((issue: z.ZodIssue) =>
        `${issue.path.join('.')}: ${issue.message}`).join(', '),
      status: 400,
    };
  }
  const form: ContactFormData = {
    name: sanitizeString(validation.data.name),
    email: sanitizeString(validation.data.email),
    interest: validation.data.interest ? sanitizeString(validation.data.interest) : undefined,
    message: validation.data.message ? sanitizeString(validation.data.message) : undefined,
    company: validation.data.company ? sanitizeString(validation.data.company) : undefined,
    projectType: validation.data.projectType ? sanitizeString(validation.data.projectType) : undefined,
    locale: validation.data.locale,
  };
  if (!form.name.trim()) {
    return { success: false, error: 'Name is required', status: 400 };
  }

  try {
    await persistContactInquiry(form);
    return { success: true };
  } catch (error) {
    // Do not log contact name, address or message.
    logError('Failed to persist contact inquiry', error);
    return {
      success: false,
      error: 'Failed to submit form. Please try again later.',
      status: error instanceof Error && error.message === 'INVALID_CONTACT_EMAIL' ? 400 : 503,
    };
  }
}
