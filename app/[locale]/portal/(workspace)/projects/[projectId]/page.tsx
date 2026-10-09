import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { PORTAL_PROJECTS_ENABLED } from '@/lib/config/portal-features';
import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  if (!PORTAL_PROJECTS_ENABLED) notFound();
  setRequestLocale(locale as 'en' | 'he');
  return <ProjectDetailClient id={projectId} />;
}
