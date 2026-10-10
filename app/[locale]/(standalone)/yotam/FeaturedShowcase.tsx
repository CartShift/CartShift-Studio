import type { CSSProperties } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { PortfolioShowcaseProject } from '@/lib/portfolio-showcase';

type Props = {
  project: PortfolioShowcaseProject;
  locale: string;
  isHebrew: boolean;
};

/**
 * Lead with product evidence rather than a second block of résumé text.
 * This intentionally reuses the canonical showcase data and project route.
 */
export default function FeaturedShowcase({ project, locale, isHebrew }: Props) {
  const copy = isHebrew
    ? {
        eyebrow: '01 / עבודה נבחרת',
        descriptor: 'מוצר מוביל',
        heading: 'לא רק רעיון. מוצר שלם.',
        contribution: 'מה בניתי',
        caseStudy: 'לסיפור הפרויקט',
        more: 'פרויקטים נוספים',
        preview: 'תצוגת המוצר',
      }
    : {
        eyebrow: '01 / Featured project',
        descriptor: 'The signature build',
        heading: 'Not just an idea. A working product.',
        contribution: 'Engineering focus',
        caseStudy: 'Explore the case study',
        more: 'Explore more projects',
        preview: 'Inside the product',
      };

  return (
    <section
      id="work"
      aria-labelledby="yotam-featured-title"
      className="yotam-featured relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-12"
      style={{ '--featured-accent': project.accent } as CSSProperties}
    >
      <div className="yotam-featured-grid mx-auto grid max-w-[1680px] gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-14">
        <div className="relative z-10">
          <p className="yotam-eyebrow text-[#5e5871]">{copy.eyebrow}</p>
          <div className="yotam-featured-rule mt-7" aria-hidden="true" />
          <p className="mt-10 text-sm font-semibold text-[#6257d8] sm:text-base">{copy.descriptor}</p>
          <h2
            id="yotam-featured-title"
            className="mt-4 max-w-[11ch] text-balance text-[clamp(2.6rem,5.9vw,5.9rem)] font-medium leading-[.96] tracking-[-.065em] text-[#1d1d1f]"
          >
            {copy.heading}
          </h2>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <span className="yotam-project-number">01</span>
            <h3 className="text-[clamp(2.1rem,5vw,4.2rem)] font-medium tracking-[-.065em] text-[#221d31]">
              {project.title}
              <span className="text-[#6257d8]">.</span>
            </h3>
          </div>
          <p className="mt-6 max-w-xl text-[16px] leading-[1.75] text-[#45404e] sm:text-lg">
            {project.summary}
          </p>
          <div className="mt-8 border-s-2 border-[#6257d8] ps-5">
            <p className="yotam-eyebrow text-[#5e5871]">{copy.contribution}</p>
            <p className="mt-2 max-w-lg text-[15px] leading-7 text-[#393340]">{project.highlights[0]}</p>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href={'/' + locale + '/portfolio/' + project.slug}
              className="yotam-button-primary group inline-flex min-h-12 items-center gap-3 rounded-full px-6 py-3.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6257d8]"
            >
              {copy.caseStudy}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </a>
            <a
              href="#more-work"
              className="inline-flex min-h-12 items-center gap-2 px-3 text-sm font-semibold text-[#4e4858] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6257d8]"
            >
              {copy.more}
              <ArrowDownRight className="size-4" />
            </a>
          </div>
        </div>
        <a
          href={'/' + locale + '/portfolio/' + project.slug}
          className="yotam-featured-frame group relative block focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-8 focus-visible:outline-[#6257d8]"
          aria-label={copy.caseStudy + ': ' + project.title}
        >
          <div className="yotam-featured-inner relative overflow-hidden">
            <div className="yotam-featured-topline flex items-center justify-between gap-4">
              <span className="text-[12px] font-semibold tracking-[.12em]">{copy.preview}</span>
              <span className="text-[12px] font-semibold tracking-[.12em]">{project.year}</span>
            </div>
            {project.hero ? (
              // Native image handles project-owned public assets and external media alike.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.hero.src}
                alt={project.hero.alt}
                loading="lazy"
                decoding="async"
                className={'yotam-featured-image ' + (project.hero.contain ? 'object-contain' : 'object-cover')}
              />
            ) : (
              <span className="yotam-featured-fallback">{project.title}</span>
            )}
            <div className="yotam-featured-bottomline">
              <span>{project.descriptor}</span>
              <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </div>
          </div>
          <div className="yotam-featured-shadow" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
