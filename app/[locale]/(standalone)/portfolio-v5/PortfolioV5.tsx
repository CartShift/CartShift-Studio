'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';
import V5Navigation from './V5Navigation';
import FluidField from './FluidField';
import AliveExperience from './AliveExperience';

type Props = { locale: 'en' | 'he' };

/**
 * The personal portfolio is an editorial journey, not a one-screen splash.
 * All project names, roles and previews come from the canonical showcase data.
 */
export default function PortfolioV5({ locale }: Props) {
  const [paused, setPaused] = useState(false);
  const he = locale === 'he';
  const home = '/' + locale + '/yotam';
  const projects = getPortfolioShowcases(locale);
  const labels = he
    ? {
        eyebrow: 'מהנדס מוצר עצמאי / ברלין',
        intro: 'היי, אני',
        name: 'יותם פרג׳י.',
        headline: 'אני הופך רעיונות',
        headlineEnd: 'למוצרים אמיתיים.',
        lead: 'מהנדס מוצר, מפתח Full-Stack ויוצר סקרן. מעצב את החוויה, בונה את המערכת, ומביא אותה לפרודקשן.',
        work: 'לגלות את העבודות',
        about: 'קצת עליי',
        scroll: 'גללו כדי לגלות',
        selected: '01 / עבודות נבחרות',
        selectedTitle: 'מעצבים את הרעיון. בונים את המציאות.',
        selectedLead: 'חמישה מוצרים, אתגרים שונים, אותה סקרנות. כל עבודה מספרת סיפור על החלטות מוצר והנדסה.',
        explore: 'לסיפור הפרויקט',
        concept: 'הדמיית קונספט — לא צילום מוצר',
        workAll: 'לכל העבודות',
        interlude: 'החיבור בין',
        interludeEmphasis: 'חשיבה יצירתית',
        interludeEnd: 'להנדסה מדויקת.',
        interludeBody: 'אני אוהב לפתור בעיות שבהן המוצר, העיצוב והטכנולוגיה צריכים לדבר באותה שפה.',
        craft: '02 / הגישה שלי',
        craftLink: 'עוד על הדרך שלי',
        contact: '03 / הצעד הבא',
        contactTitle: 'יש רעיון',
        contactTitleEnd: 'שכדאי להחיות?',
        contactBody: 'מוצר שאפתני, אתגר הנדסי או שיתוף פעולה מסקרן — אשמח לשמוע.',
        contactAction: 'בואו נדבר',
        back: 'חזרה למעלה',
        location: 'ברלין, גרמניה',
      }
    : {
        eyebrow: 'Independent product engineer / Berlin',
        intro: 'Hello, I’m',
        name: 'Yotam Faraggi.',
        headline: 'I turn ideas into',
        headlineEnd: 'real products.',
        lead: 'Product engineer, full-stack developer and curious maker. I shape the experience, engineer the system and bring it to production.',
        work: 'Explore selected work',
        about: 'More about me',
        scroll: 'Scroll to explore',
        selected: '01 / Selected work',
        selectedTitle: 'Making ideas tangible.',
        selectedLead: 'Five products, different challenges, the same curiosity. Each one tells a story of product decisions and engineering.',
        explore: 'Explore the story',
        concept: 'Concept artwork — not a product screenshot',
        workAll: 'View all projects',
        interlude: 'Where',
        interludeEmphasis: 'creative thinking',
        interludeEnd: 'meets rigorous engineering.',
        interludeBody: 'I love the messy middle where product, design and technology need to speak the same language.',
        craft: '02 / A little about my approach',
        craftLink: 'Get to know me',
        contact: '03 / What’s next?',
        contactTitle: 'Have something',
        contactTitleEnd: 'worth building?',
        contactBody: 'An ambitious product, a tricky engineering problem or an interesting collaboration — I’d love to hear about it.',
        contactAction: 'Start a conversation',
        back: 'Back to top',
        location: 'Berlin, Germany',
      };

  return (
    <main id="top" className={'v5-page v5-immersive-home v5-editorial-home' + (paused ? ' v5-motion-paused' : '')}
      dir={he ? 'rtl' : 'ltr'}>
      <a className="v5-skip-link" href="#v5-immersive-title">{he ? 'דלג לתוכן' : 'Skip to content'}</a>
      <V5Navigation locale={locale} motionPaused={paused} onToggleMotion={() => setPaused(current => !current)} />

      <section className="v5-immersive-hero v5-editorial-hero" aria-labelledby="v5-immersive-title">
        <FluidField paused={paused} />
        <div className="v5-editorial-hero-top" aria-hidden="true">
          <span>YF / 2026</span>
          <span>{labels.eyebrow}</span>
        </div>
        <div className="v5-immersive-content v5-editorial-hero-content">
          <p className="v5-immersive-pretitle">{labels.intro}</p>
          <h1 id="v5-immersive-title" className="v5-immersive-title" tabIndex={-1}>
            <span className="v5-editorial-name">{labels.name}</span>
            <span className="v5-editorial-statement">{labels.headline} <em>{labels.headlineEnd}</em></span>
          </h1>
          <p className="v5-immersive-subtitle">{labels.lead}</p>
          <nav className="v5-immersive-links" aria-label={he ? 'ניווט ראשי' : 'Explore'}>
            <a className="v5-editorial-main-link" href="#selected-work">{labels.work} <span aria-hidden="true">↘</span></a>
            <Link href={home + '/work'}>{labels.workAll} <span aria-hidden="true">↗</span></Link>
            <Link href={home + '/about'}>{labels.about} <span aria-hidden="true">↗</span></Link>
          </nav>
          <AliveExperience locale={locale} projects={projects} />
        </div>
        <div className="v5-immersive-footer v5-editorial-hero-footer">
          <span className="v5-immersive-location">{labels.location} <i aria-hidden="true" /></span>
          <a href="#selected-work">{labels.scroll} <span aria-hidden="true">↓</span></a>
          <span>© {new Date().getFullYear()} · Yotam Faraggi</span>
        </div>
      </section>

      <section id="selected-work" className="v5-editorial-work" aria-labelledby="v5-editorial-work-title">
        <div className="v5-editorial-wrap">
          <div className="v5-editorial-section-head" data-v5-reveal>
            <span className="v5-editorial-kicker">{labels.selected}</span>
            <div className="v5-editorial-heading-grid">
              <h2 id="v5-editorial-work-title">{labels.selectedTitle}</h2>
              <p>{labels.selectedLead}</p>
            </div>
          </div>

          <div className="v5-editorial-projects">
            {projects.map((project, index) => (
              <article key={project.slug} data-v5-reveal
                className={'v5-editorial-project v5-editorial-project--' + project.slug + (index % 2 ? ' v5-editorial-project--reverse' : '')}>
                <div className="v5-editorial-project-caption">
                  <span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
                  <span>{project.year}</span>
                </div>
                <Link className="v5-editorial-project-visual" href={home + '/work/' + project.slug}
                  aria-label={labels.explore + ': ' + project.title}>
                  <div className="v5-editorial-project-stage">
                    {project.hero ? (
                      <Image src={project.hero.src} alt={project.hero.alt} fill
                        unoptimized={/^https?:\/\//.test(project.hero.src)}
                        sizes="(max-width: 800px) 94vw, 67vw"
                        className="v5-editorial-product-image" />
                    ) : (
                      <span className="v5-editorial-product-fallback">{project.title}</span>
                    )}
                  </div>
                  <span className="v5-editorial-visual-corner" aria-hidden="true">↗</span>
                  {project.slug === 'ensemblis' && <span className="v5-editorial-concept">{labels.concept}</span>}
                </Link>
                <div className="v5-editorial-project-story">
                  <span className="v5-editorial-project-type">{project.descriptor} / {project.status}</span>
                  <h3>{project.title}<span aria-hidden="true">.</span></h3>
                  <p>{project.summary}</p>
                  <Link href={home + '/work/' + project.slug} className="v5-editorial-project-link">
                    {labels.explore} <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <Link className="v5-editorial-all-work" href={home + '/work'}>
            {labels.workAll} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="v5-editorial-manifesto" aria-labelledby="v5-editorial-manifesto-title">
        <div className="v5-editorial-wrap" data-v5-reveal>
          <span className="v5-editorial-kicker">{labels.craft}</span>
          <h2 id="v5-editorial-manifesto-title">
            {labels.interlude} <em>{labels.interludeEmphasis}</em> {labels.interludeEnd}
          </h2>
          <div className="v5-editorial-manifesto-bottom">
            <p>{labels.interludeBody}</p>
            <Link href={home + '/about'}>{labels.craftLink} <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="v5-editorial-outro" aria-labelledby="v5-editorial-contact-title">
        <div className="v5-editorial-wrap" data-v5-reveal>
          <span className="v5-editorial-kicker">{labels.contact}</span>
          <h2 id="v5-editorial-contact-title">{labels.contactTitle} <em>{labels.contactTitleEnd}</em></h2>
          <p>{labels.contactBody}</p>
          <Link href={home + '/contact'} className="v5-editorial-outro-cta">
            {labels.contactAction} <span aria-hidden="true">↗</span>
          </Link>
          <footer className="v5-editorial-endline">
            <span>YOTAM FARAGGI © {new Date().getFullYear()}</span>
            <a href="#top">{labels.back} ↑</a>
            <span>{labels.location}</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
