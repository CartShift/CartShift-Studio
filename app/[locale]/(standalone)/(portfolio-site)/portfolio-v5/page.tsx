import { permanentRedirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// Preserve existing experimental links while consolidating the public homepage
// under the short canonical localized URLs.
export default async function PortfolioPreviewAlias({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(locale === 'he' ? '/he' : '/en');
}
