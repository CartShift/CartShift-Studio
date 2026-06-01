import { setRequestLocale } from 'next-intl/server';
import ProposalPaymentPublicClient from './ProposalPaymentPublicClient';

export default async function ProposalPaymentPublicPage({
  params,
}: {
  params: Promise<{ locale: string; token: string; paymentToken: string }>;
}) {
  const { locale, token, paymentToken } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ProposalPaymentPublicClient token={token} paymentToken={paymentToken} />;
}
