import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import Script from 'next/script';
import { ArrowRight, BarChart3, LayoutDashboard } from 'lucide-react';
import {
  generateBreadcrumbSchema,
  generateCollectionPageSchema,
  generateMetadata as genMeta,
} from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';

  return genMeta(
    {
      title: isHe ? 'כלים לעסקים אונליין' : 'E-Commerce Tools',
      description: isHe
        ? 'כלים של CartShift Studio לאבחון חנויות, ניהול פרויקטים ושיפור תהליכי ecommerce.'
        : 'CartShift Studio tools for store audits, project visibility, and sharper ecommerce operations.',
      url: '/tools',
      keywords: ['ecommerce tools', 'store analyzer', 'client portal', 'shopify audit'],
    },
    locale as 'en' | 'he'
  );
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const validLocale = locale as 'en' | 'he';
  const isHe = validLocale === 'he';

  setRequestLocale(validLocale);

  const tools = [
    {
      title: isHe ? 'בודק החנות החינמי' : 'Free Store Analyzer',
      description: isHe
        ? 'אבחון מהיר לחנות ecommerce שמזהה פערי SEO, ביצועים, UX ואמון.'
        : 'A fast ecommerce audit for SEO gaps, performance friction, UX issues, and trust signals.',
      href: '/tools/store-analyzer',
      Icon: BarChart3,
    },
    {
      title: isHe ? 'פורטל לקוחות' : 'Client Portal',
      description: isHe
        ? 'מרחב עבודה מסודר למעקב אחרי בקשות, קבצים, משימות ותוצרים.'
        : 'A dedicated workspace for requests, files, project progress, and deliverable reviews.',
      href: '/tools/client-portal',
      Icon: LayoutDashboard,
    },
  ];

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: isHe ? 'בית' : 'Home', url: '/' },
      { name: isHe ? 'כלים' : 'Tools', url: '/tools' },
    ],
    validLocale
  );

  const collectionSchema = generateCollectionPageSchema({
    name: isHe ? 'כלים לעסקים אונליין' : 'E-Commerce Tools',
    description: isHe
      ? 'כלים של CartShift Studio לאבחון חנויות וניהול פרויקטים.'
      : 'CartShift Studio tools for ecommerce audits and project visibility.',
    url: '/tools',
    locale: validLocale,
    items: tools.map(tool => ({
      name: tool.title,
      url: tool.href,
      description: tool.description,
    })),
  });

  return (
    <>
      <Script
        id="tools-breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="tools-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <main className="min-h-screen bg-white text-surface-950 dark:bg-surface-950 dark:text-white">
        <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pb-28 lg:pt-40">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl text-start">
              <p className="mb-5 inline-flex rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-700 dark:text-primary-300">
                CartShift Studio
              </p>
              <h1 className="font-display text-4xl font-black leading-tight tracking-tight text-surface-950 dark:text-white sm:text-5xl lg:text-6xl">
                {isHe ? 'כלים שמחדדים את העבודה הדיגיטלית' : 'Tools for sharper ecommerce work'}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-surface-600 dark:text-surface-300">
                {isHe
                  ? 'אבחון, שקיפות ותפעול במקום אחד, כדי להפוך בעיות באתר להזדמנויות ברורות לפעולה.'
                  : 'Audit, visibility, and operations in one place, turning site problems into clear next actions.'}
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {tools.map(({ title, description, href, Icon }) => (
                <Link
                  key={href}
                  href={`/${validLocale}${href}`}
                  className="group block rounded-2xl border border-surface-200 bg-surface-50 p-6 transition-colors hover:border-primary-500/40 hover:bg-white dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-primary-400/50 dark:hover:bg-white/[0.06] sm:p-8"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-700 dark:text-primary-300">
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-surface-950 dark:text-white">
                          {title}
                        </h2>
                        <p className="mt-3 text-base leading-7 text-surface-600 dark:text-surface-300">
                          {description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={22}
                      aria-hidden="true"
                      className="mt-3 shrink-0 text-surface-400 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
