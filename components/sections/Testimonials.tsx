import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight, Quote } from 'lucide-react';

type Testimonial = {
  quote: string;
  author: string;
  company: string;
  role?: string;
};

const caseLinks: Record<string, string> = {
  'I Love My Honeypot': '/work/i-love-my-honeypot-eco-ecommerce',
  Alondon: '/work/alondon-community-portal',
  'Stiletto Piercing': '/work/stiletto-piercing-disposable-jewelry-supply',
};

export async function Testimonials() {
  const t = await getTranslations('testimonials');
  const items = t.raw('items') as Testimonial[];
  if (!items?.length) return null;

  return (
    <section aria-labelledby="testimonials-title" className="border-y border-surface-200 bg-white py-20 dark:border-white/10 dark:bg-surface-950 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl">
          <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            {t('title')}
          </p>
          <h2 id="testimonials-title" className="mt-4 font-display text-3xl font-bold tracking-tight text-surface-900 dark:text-white sm:text-4xl">
            {t('subtitle')}
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {items.map(item => (
            <figure key={item.author + item.company} className="flex h-full flex-col rounded-3xl border border-surface-200 bg-surface-50 p-7 dark:border-white/10 dark:bg-surface-900/70 md:p-8">
              <Quote aria-hidden="true" className="mb-6 h-7 w-7 text-primary-500" />
              <blockquote className="flex-1 text-base leading-relaxed text-surface-800 dark:text-surface-100">
                “{item.quote}”
              </blockquote>
              <figcaption className="mt-8 border-t border-surface-200 pt-5 dark:border-white/10">
                <p className="font-bold text-surface-900 dark:text-white">{item.author}</p>
                <p className="mt-1 text-sm text-surface-600 dark:text-surface-300">
                  {[item.role, item.company].filter(Boolean).join(' · ')}
                </p>
                {caseLinks[item.company] && (
                  <Link href={caseLinks[item.company]} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:underline dark:text-primary-300">
                    {t('viewProject')} <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
