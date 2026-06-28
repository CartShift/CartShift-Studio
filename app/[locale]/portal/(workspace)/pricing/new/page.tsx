import { redirect } from 'next/navigation';

export default async function NewPricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const requestIds = typeof query.requestIds === 'string' ? `&requestIds=${encodeURIComponent(query.requestIds)}` : '';
  redirect(`/${locale}/portal/requests/new?mode=quote${requestIds}`);
}
