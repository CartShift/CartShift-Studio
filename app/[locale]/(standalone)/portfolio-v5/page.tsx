import { permanentRedirect } from 'next/navigation';
type Props = { params: Promise<{ locale: string }> };
export default async function LegacyPortfolioHome({ params }: Props) {
  const { locale } = await params;
  permanentRedirect('/' + (locale === 'he' ? 'he' : 'en') + '/yotam');
}
