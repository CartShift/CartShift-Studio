import { setRequestLocale } from 'next-intl/server';
import ProjectsListClient from './ProjectsListClient';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as 'en' | 'he');
  return <ProjectsListClient initialClientFilter={query.client || 'all'} />;
}
