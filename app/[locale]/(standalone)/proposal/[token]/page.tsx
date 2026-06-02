import { setRequestLocale } from 'next-intl/server';
import ProposalPublicClient from './ProposalPublicClient';

export default async function ProposalPublicPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ProposalPublicClient token={token} />;
}
