import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { CaseStudyMeta } from '@/lib/case-studies';
import { getTranslations } from 'next-intl/server';

interface CaseStudiesTeaserProps {
  caseStudies: CaseStudyMeta[];
  locale: 'en' | 'he';
}

export async function CaseStudiesTeaser({ caseStudies, locale }: CaseStudiesTeaserProps) {
  if (caseStudies.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'featuredWork' });

  return (
    <section
      aria-labelledby="featured-work-title"
      className="bg-surface-50 px-4 py-20 text-surface-900 dark:bg-surface-950 dark:text-white sm:px-6 md:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 max-w-3xl md:mb-14">
          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {t('eyebrow')}
          </span>
          <h2
            id="featured-work-title"
            className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl"
          >
            {t('title')}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-surface-600 dark:text-surface-300 md:text-lg">
            {t('description')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {caseStudies.map(study => (
            <Link
              key={study.slug}
              href={`/work/${study.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-surface-200 bg-white transition-colors hover:border-primary-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-white/10 dark:bg-surface-900 dark:hover:border-primary-400"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-100 dark:bg-surface-800">
                <Image
                  src={study.thumbnail || study.hero.image}
                  alt={study.hero.alt || study.title}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover object-top transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="mb-3 text-xs font-semibold text-surface-500 dark:text-surface-400">
                  {study.platform} · {study.industry}
                </p>
                <h3 className="text-xl font-bold leading-snug">{study.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  {study.summary}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {t('readMore')}
                  <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/work"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-300 px-5 py-3 font-semibold transition-colors hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500 dark:border-white/20 dark:hover:bg-white/5"
          >
            {t('viewAll')}
            <ArrowRight aria-hidden="true" className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
