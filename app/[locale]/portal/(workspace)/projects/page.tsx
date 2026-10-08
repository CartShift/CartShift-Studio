import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PORTAL_PROJECTS_ENABLED } from '@/lib/config/portal-features';
import ProjectsListClient from './ProjectsListClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!PORTAL_PROJECTS_ENABLED) notFound();
  setRequestLocale(locale as 'en' | 'he');
  return <ProjectsListClient initialClientFilter={query.client || 'all'} />;
}
