import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PortfolioV2RedirectPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/portfolio`);
}
