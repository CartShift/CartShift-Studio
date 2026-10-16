'use client';

import React from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { ShopifyPageContent } from '@/components/sections/ShopifyPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export const ShopifyTemplate: React.FC = () => {
  const t = useTranslations();
  const he = useLocale() === 'he';

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.solutions'), href: '/' },
    { label: t('navigation.shopify'), href: '/solutions/shopify' },
  ];

  return (
    <>
      <PageHero
        title={t('shopify.hero.title')}
        subtitle={t('shopify.hero.subtitle')}
        description={t('shopify.hero.description')}
        seoH1="Shopify SEO and Development Services | Audits, Speed, Migration, and Growth"
      />
      <div className="bg-surface-50 dark:bg-black border-b border-surface-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <section aria-labelledby="shopify-specialties" className="bg-background px-4 py-16 text-surface-900 dark:bg-surface-950 dark:text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 id="shopify-specialties" className="text-3xl font-bold">
            {he ? 'פתרונות לבעיות שעוצרות חנויות Shopify' : 'Focused help for growing Shopify stores'}
          </h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-surface-600 dark:text-surface-300">
            {he
              ? 'מתחילים באבחון אמיתי ובוחרים את הפתרון המתאים — לא עוד אפליקציה או בנייה מחדש בלי צורך.'
              : 'Start with the actual problem, not a generic score or an unnecessary rebuild.'}
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {([
              {
                slug: 'shopify-conversion-optimization',
                en: 'Conversion optimization',
                he: 'שיפור יחס המרה',
                enDesc: 'Product pages, mobile buying friction, and cart usability.',
                heDesc: 'דפי מוצר, חיכוך ברכישה במובייל וחוויית העגלה.'
              },
              {
                slug: 'shopify-b2b-integrations',
                en: 'B2B & integrations',
                he: 'B2B ואינטגרציות',
                enDesc: 'Wholesale processes, inventory sync, and operational reliability.',
                heDesc: 'תהליכי סיטונאות, סנכרון מלאי ואמינות תפעולית.'
              },
              {
                slug: 'shopify-performance-seo',
                en: 'Technical SEO & speed',
                he: 'SEO טכני וביצועים',
                enDesc: 'Indexability, canonicals, storefront scripts, and site performance.',
                heDesc: 'אינדוקס, כתובות קנוניות, סקריפטים ומהירות החנות.'
              }
            ] as const).map(item => (
              <Link key={item.slug}
                href={'/services/' + item.slug}
                className="group rounded-2xl border border-surface-200 bg-surface-50 p-6 transition-colors hover:border-primary-500 dark:border-white/10 dark:bg-surface-900">
                <h3 className="text-xl font-bold group-hover:text-primary-600">{he ? item.he : item.en}</h3>
                <p className="mt-3 leading-relaxed text-surface-600 dark:text-surface-300">{he ? item.heDesc : item.enDesc}</p>
                <span className="mt-5 inline-block font-semibold text-primary-600">
                  {he ? 'מידע נוסף ←' : 'Learn more →'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ShopifyPageContent />
    </>
  );
};
