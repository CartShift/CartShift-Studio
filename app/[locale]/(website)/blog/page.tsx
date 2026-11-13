import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BlogTemplate } from '@/components/templates/BlogTemplate';
import { getAllPosts } from '@/lib/markdown';
import { toBlogPostSummary } from '@/lib/blog-summary';
import {
  generateMetadata as genMeta,
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
} from '@/lib/seo';
import Script from 'next/script';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';
  return genMeta(
    {
      title: isHe ? 'מדריכים ותובנות לאיקומרס ול־Shopify | CartShift Studio' : locale === 'de' ? 'Shopify- und E-Commerce-Ratgeber | CartShift Studio' : 'Shopify & E-commerce Guides | CartShift Studio',
      description: isHe
        ? 'מדריכים מעשיים לשיפור חנויות Shopify: SEO טכני, מהירות, המרות, אינטגרציות ותהליכי עבודה.'
        : locale === 'de'
          ? 'Praxisnahe Shopify- und E-Commerce-Ratgeber zu technischem SEO, Performance, Conversion, Integrationen und Shop-Prozessen.'
          : 'Practical Shopify and e-commerce guides covering technical SEO, performance, conversions, integrations and store operations.',
      url: '/blog',
      keywords: [
        'e-commerce blog',
        'Shopify tips',
        'WordPress tutorials',
        'e-commerce SEO',
        'Shopify guides',
        'online store optimization',
        'e-commerce conversion',
        'Shopify vs WooCommerce',
      ],
    },
    locale as 'en' | 'he' | 'de'
  );
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as 'en' | 'he' | 'de');
  const posts = await getAllPosts();
  const summaries = posts.map(toBlogPostSummary);
  const t = await getTranslations({ locale: locale as 'en' | 'he' | 'de' });
  const categories = Array.from(new Set(posts.map(post => post.category)));

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: t('navigation.home'), url: `${baseUrl}/${locale}` },
      { name: t('nav.blog'), url: `${baseUrl}/${locale}/blog` },
    ],
    locale as 'en' | 'he' | 'de'
  );

  const collectionSchema = generateCollectionPageSchema({
    name: locale === 'he' ? 'מדריכי Shopify ואיקומרס' : locale === 'de' ? 'Shopify- und E-Commerce-Ratgeber' : 'Shopify & E-commerce Guides',
    description: locale === 'he' ? 'מדריכים מעשיים לחנויות אונליין' : locale === 'de' ? 'Praxisnahe Ratgeber für Onlineshops' : 'Practical e-commerce guides',
    url: `${baseUrl}/${locale}/blog`,
    locale: locale as 'en' | 'he' | 'de',
    items: posts.slice(0, 10).map(post => ({
      name: locale === 'de' ? post.translations?.de?.title || post.title : locale === 'he' ? post.translation?.title || post.title : post.title,
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      description: locale === 'de' ? post.translations?.de?.excerpt || post.excerpt : locale === 'he' ? post.translation?.excerpt || post.excerpt : post.excerpt,
    })),
  });

  return (
    <>
      <Script
        id="blog-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="blog-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <BlogTemplate posts={summaries} categories={categories} />
    </>
  );
}
