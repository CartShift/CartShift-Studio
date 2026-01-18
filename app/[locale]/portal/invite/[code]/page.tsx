import { setRequestLocale } from 'next-intl/server';
import InviteClient from './InviteClient';

export default async function InvitePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <InviteClient />;
}
