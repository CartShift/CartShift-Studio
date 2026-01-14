'use client';

import React from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { WordPressPageContent } from '@/components/sections/WordPressPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useTranslations } from 'next-intl';

export const WordPressTemplate: React.FC = () => {
  const t = useTranslations();

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.solutions'), href: '/' },
    { label: t('navigation.wordpress'), href: '/solutions/wordpress' },
  ];

  return (
    <>
      <PageHero
        title={t('wordpress.hero.title')}
        subtitle={t('wordpress.hero.subtitle')}
        description={t('wordpress.hero.description')}
        badge={t('wordpress.hero.badge')}
        seoH1="WordPress E-commerce Development Services | Custom Websites & Content Sites"
      />
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <WordPressPageContent />
    </>
  );
};
