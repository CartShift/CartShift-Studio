import { setRequestLocale } from 'next-intl/server';
import ForgotPasswordClient from './ForgotPasswordClient';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ForgotPasswordClient />;
}
