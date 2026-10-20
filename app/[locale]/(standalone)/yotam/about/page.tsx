import type { Metadata } from 'next';
import V5AboutPage from '../../portfolio-v5/about/page';
import { yotamMetadata } from '../portfolio-seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return yotamMetadata(locale === 'he' ? 'he' : 'en', 'about');
}

export default V5AboutPage;
