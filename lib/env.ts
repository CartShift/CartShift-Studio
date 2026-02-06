import { z } from 'zod';

// Default Firebase function URL (Cloud Functions endpoint)
const DEFAULT_FIREBASE_FUNCTION_URL =
  'https://us-central1-cartshiftstudio.cloudfunctions.net/contactForm';

// Default company contact email
const DEFAULT_CONTACT_EMAIL = 'hello@cart-shift.com';

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://cart-shift.com'),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  // Use .url() with .optional() and transform to provide fallback
  NEXT_PUBLIC_FIREBASE_FUNCTION_URL: z
    .string()
    .url()
    .optional()
    .transform(val => val || DEFAULT_FIREBASE_FUNCTION_URL),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API Key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase Auth Domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase App ID is required'),
  CONTACT_EMAIL: z.string().email().default(DEFAULT_CONTACT_EMAIL),
});

const parseResult = envSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
  NEXT_PUBLIC_FIREBASE_FUNCTION_URL: process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL || undefined,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || DEFAULT_CONTACT_EMAIL,
});

if (!parseResult.success) {
  const msg = `Environment validation failed: ${JSON.stringify(parseResult.error.flatten())}`;
  console.error('❌', msg);
  throw new Error(msg);
}

export const env = parseResult.data;
