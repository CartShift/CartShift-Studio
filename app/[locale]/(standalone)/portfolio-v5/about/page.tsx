import { permanentRedirect } from 'next/navigation';
type Props = { params: Promise<{ locale: string }> };
export default async function LegacyPortfolioAbout({ params }: Props) {
  const { locale } = await params;
  permanentRedirect('/' + (locale === 'he' ? 'he' : 'en') + '/yotam/about');
}
