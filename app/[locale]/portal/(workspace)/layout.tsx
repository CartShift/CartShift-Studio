import { redirect } from 'next/navigation';
import { PortalShell } from '@/components/portal/PortalShell';
import { setRequestLocale } from 'next-intl/server';
import { getServerSession } from '@/lib/auth/server-auth';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');

  // Server-side auth guard: redirect if Admin SDK is configured and no valid session
  // Returns undefined when Admin SDK is not available (graceful degradation for dev)
  const session = await getServerSession();
  if (session === null) {
    redirect(`/${locale}/portal/login/`);
  }

  return <PortalShell>{children}</PortalShell>;
}
