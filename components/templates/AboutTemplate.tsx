'use client';

import React from 'react';
import { AboutPageContent } from '@/components/sections/AboutPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useTranslations } from 'next-intl';

export const AboutTemplate: React.FC = () => {
  const t = useTranslations();

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.about'), href: '/about' },
  ];

  return (
    <>
      <div className="bg-surface-50 dark:bg-surface-950 border-b border-surface-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <AboutPageContent />
    </>
  );
};
