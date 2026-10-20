import type { Metadata } from 'next';
import V5WorkPage from '../../portfolio-v5/work/page';
import { yotamMetadata } from '../portfolio-seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return yotamMetadata(locale === 'he' ? 'he' : 'en', 'work');
}

export default V5WorkPage;
