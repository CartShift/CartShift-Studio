import { setRequestLocale } from 'next-intl/server';
import ProjectsListClient from './ProjectsListClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ params }: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ProjectsListClient />;
}
