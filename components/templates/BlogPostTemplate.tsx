'use client';

import React from 'react';
import { PageHero } from '@/components/sections/PageHero';
import { BlogPostContent } from '@/components/sections/BlogPostContent';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useLocale, useTranslations } from 'next-intl';
import { BlogPost } from '@/lib/markdown';
import { isRTLLocale, getDateLocaleString } from '@/lib/locale-config';

interface BlogPostTemplateProps {
  post: BlogPost;
  relatedPosts: Array<{
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    image?: string;
    imageAlt?: string;
    translation?: {
      title: string;
      excerpt: string;
      category: string;
    };
  }>;
}

export const BlogPostTemplate: React.FC<BlogPostTemplateProps> = ({ post, relatedPosts }) => {
  const t = useTranslations();
  const locale = useLocale();
  const isHe = isRTLLocale(locale);

  const title = isHe && post.translation?.title ? post.translation.title : post.title;
  const subtitle = isHe && post.translation?.category ? post.translation.category : post.category;

  const content = isHe && post.translation?.content ? post.translation.content : post.content;

  // Format date correctly based on locale
  const formattedDate = new Date(post.date).toLocaleDateString(getDateLocaleString(locale));
  const readingTimeText = post.readingTime
    ? isHe
      ? ` • ${post.readingTime} דקות קריאה`
      : ` • ${post.readingTime} min read`
    : '';

  const finalDescription = `${formattedDate}${readingTimeText}`;

  // Process related posts for current language
  const processedRelatedPosts = relatedPosts.map(p => ({
    slug: p.slug,
    title: isHe && p.translation?.title ? p.translation.title : p.title,
    excerpt: isHe && p.translation?.excerpt ? p.translation.excerpt : p.excerpt,
    category: isHe && p.translation?.category ? p.translation.category : p.category,
    date: p.date,
    image: p.image,
    imageAlt: p.imageAlt,
    translation: p.translation,
  }));

  const breadcrumbItems = [
    { label: t('navigation.home'), href: '/' },
    { label: t('navigation.blog'), href: '/blog' },
    { label: title, href: `/blog/${post.slug}` },
  ];

  return (
    <>
      <PageHero
        title={title}
        subtitle={subtitle}
        description={finalDescription}
        badge={t('navigation.blogPost')}
        highlightLastWord={false}
        compact
        backgroundImage={post.image}
        backgroundImageAlt={post.imageAlt || title}
        backgroundImagePriority
      />
      <div className="bg-surface-50 dark:bg-black border-b border-surface-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      <BlogPostContent
        slug={post.slug}
        content={content}
        relatedPosts={processedRelatedPosts}
        title={title}
        date={post.date}
        category={subtitle}
        readingTime={post.readingTime}
      />
    </>
  );
};
