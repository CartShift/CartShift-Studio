import { setRequestLocale } from 'next-intl/server';
import ProjectDetailClient from './ProjectDetailClient';

export const dynamic = 'force-dynamic';

export default async function ProjectDetailPage({ params }: {
  params: Promise<{ locale: string; projectId: string }>;
}) {
  const { locale, projectId } = await params;
  setRequestLocale(locale as 'en' | 'he');
  return <ProjectDetailClient id={projectId} />;
}
