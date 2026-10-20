import type { Metadata } from 'next';
import V5ContactPage from '../../portfolio-v5/contact/page';
import { yotamMetadata } from '../portfolio-seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return yotamMetadata(locale === 'he' ? 'he' : 'en', 'contact');
}

export default V5ContactPage;
