import { setRequestLocale } from 'next-intl/server';
import SignupClient from './SignupClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign Up | CartShift Portal' };

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <SignupClient />;
}
