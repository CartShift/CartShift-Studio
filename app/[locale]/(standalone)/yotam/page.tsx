import type { Metadata } from 'next';
import Script from 'next/script';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import PortfolioV5 from '../portfolio-v5/PortfolioV5';
import { yotamMetadata } from './portfolio-seo';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return yotamMetadata(locale === 'he' ? 'he' : 'en', 'home');
}

export default async function YotamHomePage({ params }: Props) {
  const { locale } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  setRequestLocale(language);
  const t = await getTranslations({ locale: language, namespace: 'cv' });
  const url = (process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com').replace(/\/$/, '');
  const person = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    inLanguage: language === 'he' ? 'he-IL' : 'en-US',
    mainEntity: {
      '@type': 'Person',
      name: t('name'),
      jobTitle: 'Senior Product Engineer',
      url: url + '/' + language + '/yotam',
      email: t('email'),
      sameAs: ['https://linkedin.com/in/yotam-faraggi', 'https://github.com/yotamon'],
      worksFor: { '@type': 'Organization', name: 'CartShift Studio', url },
      address: { '@type': 'PostalAddress', addressLocality: 'Berlin', addressCountry: 'DE' },
    },
  };
  return (
    <>
      <Script id="yotam-person-jsonld" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />
      <PortfolioV5 locale={language} />
    </>
  );
}
