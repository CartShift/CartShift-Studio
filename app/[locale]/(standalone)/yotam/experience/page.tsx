import type { Metadata } from 'next';
import V5ExperiencePage from '../../portfolio-v5/experience/page';
import { yotamMetadata } from '../portfolio-seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return yotamMetadata(locale === 'he' ? 'he' : 'en', 'experience');
}

export default V5ExperiencePage;
