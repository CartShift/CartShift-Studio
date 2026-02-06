import { redirect } from 'next/navigation';
import { PortalShell } from '@/components/portal/PortalShell';
import { setRequestLocale } from 'next-intl/server';
import { getServerSession } from '@/lib/auth/server-auth';

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  const session = await getServerSession();
  if (session === null) {
    redirect(`/${locale}/portal/login/`);
  }

  return <PortalShell isAgency>{children}</PortalShell>;
}
