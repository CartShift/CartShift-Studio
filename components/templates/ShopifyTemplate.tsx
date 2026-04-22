'use client';

import React from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { ShopifyPageContent } from '@/components/sections/ShopifyPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useTranslations } from 'next-intl';

export const ShopifyTemplate: React.FC = () => {
  const t = useTranslations();

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
        badge={t('shopify.hero.badge')}
        seoH1="Shopify SEO and Development Services | Audits, Speed, Migration, and Growth"
      />
      <div className="bg-surface-50 dark:bg-black border-b border-surface-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <ShopifyPageContent />
    </>
  );
};
