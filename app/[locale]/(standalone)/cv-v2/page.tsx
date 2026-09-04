import { permanentRedirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CVV2RedirectPage({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/cv`);
}
