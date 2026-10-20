import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import {
  getPortfolioShowcase,
  getNextPortfolioShowcase,
  portfolioShowcaseSlugs,
  type ShowcaseMedia,
} from '@/lib/portfolio-showcase';
import V5Navigation from '../../../portfolio-v5/V5Navigation';

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return portfolioShowcaseSlugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  const project = getPortfolioShowcase(slug, language);
  if (!project) return { title: 'Project not found', robots: { index: false } };
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://cart-shift.com';
  const url = site + '/' + language + '/yotam/work/' + slug;
  return {
    title: { absolute: project.title + ' — ' + project.descriptor + ' | Yotam Faraggi' },
    description: project.summary,
    alternates: {
      canonical: url,
      languages: {
        en: site + '/en/yotam/work/' + slug,
        he: site + '/he/yotam/work/' + slug,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: project.title + ' | Yotam Faraggi',
      description: project.summary,
      url,
      type: 'article',
    },
  };
}

function ProjectImage({ media, priority = false }: { media: ShowcaseMedia; priority?: boolean }) {
  return (
    <figure className={'v5-case-image' + (media.aspect === 'portrait' ? ' v5-case-image--portrait' : '')}>
      <div className="v5-case-image-stage">
        <Image src={media.src} alt={media.alt} fill priority={priority}
          unoptimized={/^https?:\/\//.test(media.src)}
          sizes="(max-width: 750px) 93vw, 84vw"
          className="v5-case-image-asset" />
      </div>
      <figcaption>
        <span>{media.label}</span>
        <span>{media.caption}</span>
      </figcaption>
    </figure>
  );
}

/** Case studies reuse the same factual product data as the canonical portfolio. */
export default async function PersonalProjectCaseStudy({ params }: Props) {
  const { locale, slug } = await params;
  const language = locale === 'he' ? 'he' : 'en';
  setRequestLocale(language);
  const he = language === 'he';
  const project = getPortfolioShowcase(slug, language);
  if (!project) notFound();
  const next = getNextPortfolioShowcase(slug, language);
  const home = '/' + language + '/yotam';
  const media = [project.hero, ...project.gallery].filter((item): item is ShowcaseMedia => item !== null);

  const copy = he
    ? {
        back: 'לכל העבודות',
        kicker: 'מבט מבפנים / מקרה בוחן',
        overview: 'על הפרויקט',
        audience: 'למי זה מיועד',
        role: 'התפקיד שלי',
        approach: 'החלטות מוצר והנדסה',
        gallery: 'המוצר מקרוב',
        conceptual: 'הדמיה קונספטואלית — לא צילום ממשק',
        technologies: 'טכנולוגיות',
        live: 'לאתר המוצר',
        source: 'לקוד המקור',
        next: 'הפרויקט הבא',
        contact: 'יש משהו שנוכל לבנות יחד?',
        contactAction: 'בואו נדבר',
      }
    : {
        back: 'All projects',
        kicker: 'Behind the product / Case study',
        overview: 'The project',
        audience: 'Built for',
        role: 'My role',
        approach: 'Product and engineering decisions',
        gallery: 'Inside the product',
        conceptual: 'Concept artwork — not a product screenshot',
        technologies: 'Built with',
        live: 'Visit product',
        source: 'View source',
        next: 'Up next',
        contact: 'Something worth building together?',
        contactAction: 'Get in touch',
      };

  return (
    <main className="v5-page v5-subpage v5-subpage--work v5-case-study" dir={he ? 'rtl' : 'ltr'}>
      <a href="#v5-case-title" className="v5-skip-link">{he ? 'דלג לתוכן' : 'Skip to content'}</a>
      <V5Navigation locale={language} section="work" />
      <div className="v5-case-shell">
        <div className="v5-case-topline">
          <Link href={home + '/work'}><span aria-hidden="true">↖</span> {copy.back}</Link>
          <span>{project.number} / {project.year}</span>
        </div>
        <section className="v5-case-intro" aria-labelledby="v5-case-title">
          <span className="v5-case-kicker">{copy.kicker} · {project.descriptor}</span>
          <h1 id="v5-case-title" tabIndex={-1}>{project.title}<span>.</span></h1>
          <div className="v5-case-intro-footer">
            <p>{project.summary}</p>
            <span className="v5-case-status">{project.status}</span>
          </div>
        </section>

        {project.hero && (
          <div className={'v5-case-cover v5-case-cover--' + project.slug}>
            <ProjectImage media={project.hero} priority />
            {project.slug === 'ensemblis' && <span className="v5-case-concept">{copy.conceptual}</span>}
          </div>
        )}
        <section className="v5-case-context" aria-label={copy.overview}>
          <div className="v5-case-context-lead">
            <span className="v5-case-kicker">01 / {copy.overview}</span>
            <h2>{project.descriptor}</h2>
            <p>{project.summary}</p>
          </div>
          <div className="v5-case-facts">
            <div><h3>{copy.audience}</h3><p>{project.audience}</p></div>
            <div><h3>{copy.role}</h3><p>{project.role}</p></div>
            <div><h3>{copy.technologies}</h3><p>{project.technologies.join(' · ')}</p></div>
          </div>
        </section>
        <section className="v5-case-decisions" aria-labelledby="v5-case-decisions-heading">
          <span className="v5-case-kicker">02 / {copy.approach}</span>
          <h2 id="v5-case-decisions-heading">{copy.approach}<span>.</span></h2>
          <ol>
            {project.highlights.map((highlight, index) => (
              <li key={highlight}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <p>{highlight}</p>
              </li>
            ))}
          </ol>
        </section>
        {media.length > 1 && (
          <section className="v5-case-gallery" aria-label={copy.gallery}>
            <span className="v5-case-kicker">03 / {copy.gallery}</span>
            {media.slice(1).map((image, index) => <ProjectImage key={image.src + index} media={image} />)}
          </section>
        )}
        {(project.liveUrl || project.repositoryUrl) && (
          <div className="v5-case-external">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
              {copy.live} <span aria-hidden="true">↗</span>
            </a>}
            {project.repositoryUrl && <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
              {copy.source} <span aria-hidden="true">↗</span>
            </a>}
          </div>
        )}
      </div>
      <section className="v5-case-next">
        <div className="v5-case-shell">
          {next && (
            <Link href={home + '/work/' + next.slug} className="v5-case-next-link">
              <span>{copy.next} / {next.number}</span>
              <strong>{next.title}<i aria-hidden="true">↗</i></strong>
            </Link>
          )}
          <div className="v5-case-contact">
            <p>{copy.contact}</p>
            <Link href={home + '/contact'}>{copy.contactAction} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
