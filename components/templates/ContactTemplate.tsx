'use client';

import React, { Suspense } from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { ContactPageContent } from '@/components/sections/ContactPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useTranslations } from 'next-intl';

export const ContactTemplate: React.FC = () => {
  const t = useTranslations();

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.contact'), href: '/contact' },
  ];

  return (
    <>
      <PageHero
        title={t('contact.hero.title')}
        subtitle={t('contact.hero.subtitle')}
        description={t('contact.hero.description')}
      />
      <div className="bg-surface-50 dark:bg-surface-900 border-b border-surface-200 dark:border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <Suspense fallback={null}>
        <ContactPageContent />
      </Suspense>
    </>
  );
};
