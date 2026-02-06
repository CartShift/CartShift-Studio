import { setRequestLocale } from 'next-intl/server';
import LoginClient from './LoginClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Login | CartShift Portal' };

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <LoginClient />;
}
