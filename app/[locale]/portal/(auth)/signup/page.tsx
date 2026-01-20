import { setRequestLocale } from 'next-intl/server';
import SignupClient from './SignupClient';

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <SignupClient />;
}
