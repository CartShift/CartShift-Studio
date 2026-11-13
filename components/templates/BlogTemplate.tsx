'use client';

import React from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { BlogPageContent } from '@/components/sections/BlogPageContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useTranslations } from 'next-intl';
import type { BlogPostSummary } from '@/lib/blog-summary';


interface BlogTemplateProps {
  posts: BlogPostSummary[];
  categories: string[];
}

export const BlogTemplate: React.FC<BlogTemplateProps> = ({ posts, categories }) => {
  const t = useTranslations();

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.blog'), href: '/blog' },
  ];

  return (
    <>
      <PageHero
        title={t('blog.hero.title')}
        subtitle={t('blog.hero.subtitle')}
        description=""
      />
      <div className="bg-surface-50 dark:bg-black border-b border-surface-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <BlogPageContent posts={posts} categories={categories} />
    </>
  );
};
