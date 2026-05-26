import { logError } from '@/lib/logger';

export interface ContactFormSubmitData {
  name: string;
  email: string;
  subject?: string;
  message: string;
  company?: string;
  projectType?: string;
  locale?: 'en' | 'he';
}

export async function submitContactForm(data: ContactFormSubmitData) {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit form');
    }

    return await response.json();
  } catch (error) {
    logError('Contact form submission failed', error);
    throw error;
  }
}
