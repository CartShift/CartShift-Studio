import { permanentRedirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CVPage({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/yotam#experience`);
}
