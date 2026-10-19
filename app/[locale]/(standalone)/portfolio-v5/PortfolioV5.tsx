'use client';

import { useState, type PointerEvent } from 'react';
import { translations } from './v5-copy';
import V5Navigation from './V5Navigation';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

type Props = { locale: 'en' | 'he'; email: string };

const featuredSlugs = ['starlinker', 'rightflow', 'cartshift-studio', 'ensemblis'];



export default function PortfolioV5({ locale, email }: Props) {
  const t = translations[locale];
  const isHebrew = locale === 'he';
  const [motionPaused, setMotionPaused] = useState(false);
  const projects = getPortfolioShowcases(locale).filter(project => featuredSlugs.includes(project.slug));

  function onHeroPointerMove(event: PointerEvent<HTMLElement>) {
    if (motionPaused || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 26;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 26;
    event.currentTarget.style.setProperty('--v5-pointer-x', x.toFixed(1) + 'px');
    event.currentTarget.style.setProperty('--v5-pointer-y', y.toFixed(1) + 'px');
  }

  function resetPointer(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--v5-pointer-x', '0px');
    event.currentTarget.style.setProperty('--v5-pointer-y', '0px');
  }

  return (
    <main
      id="top"
      className={'v5-page' + (motionPaused ? ' v5-motion-paused' : '')}
      dir={isHebrew ? 'rtl' : 'ltr'}
    >
      <a className="v5-skip-link" href="#work">{t.skip}</a>

      <V5Navigation locale={locale} motionPaused={motionPaused} onToggleMotion={() => setMotionPaused(paused => !paused)} />

      <section
        className="v5-hero"
        aria-labelledby="v5-hero-title"
        onPointerMove={onHeroPointerMove}
        onPointerLeave={resetPointer}
      >
        <div className="v5-hero-grain" aria-hidden="true" />
        <div className="v5-sculptures" aria-hidden="true">
          <div className="v5-blob v5-blob--mint"><span /></div>
          <div className="v5-blob v5-blob--sun"><span /></div>
          <div className="v5-blob v5-blob--violet"><span /></div>
          <div className="v5-blob v5-blob--pearl"><span /></div>
          <div className="v5-blob v5-blob--coral"><span /></div>
          <div className="v5-blob v5-blob--aqua"><span /></div>
        </div>
        <div className="v5-hero-copy">
          <div className="v5-eyebrow"><span className="v5-eyebrow-dot" />{t.experiment}</div>
          <h1 id="v5-hero-title">
            <span className="v5-type-outline">{t.hello}</span>
            <span className="v5-type-solid">{t.name}</span>
            <span className="v5-type-outline">{t.bridge}</span>
            <span className="v5-type-solid v5-type-last">{t.payoff}</span>
          </h1>
          <p className="v5-hero-description">{t.intro}</p>
          <div className="v5-hero-actions">
            <a href={'/' + locale + '/portfolio-v5/work'}><span aria-hidden="true">↗</span>{t.seeWork}</a>
            <a href={'/' + locale + '/portfolio-v5/about'}><span aria-hidden="true">↗</span>{t.seeAbout}</a>
          </div>
        </div>
        <div className="v5-hero-bottom">
          <span>{t.availability}</span>
          <a href="#work">{t.scroll}<span aria-hidden="true">↓</span></a>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </section>

      <section className="v5-work" id="work" aria-labelledby="v5-work-title">
        <div className="v5-shell">
          <div className="v5-section-heading">
            <span className="v5-section-kicker">{t.workEyebrow}</span>
            <h2 id="v5-work-title">{t.workTitle}</h2>
            <p>{t.workLead}</p>
          </div>
          <div className="v5-projects">
            {projects.map((project, index) => (
              <a
                className={'v5-project v5-project--' + project.slug}
                href={'/' + locale + '/portfolio/' + project.slug}
                key={project.slug}
                aria-label={project.title + ' — ' + t.caseStudy}
              >
                <div className="v5-project-topline">
                  <span>0{index + 1} / {project.descriptor}</span>
                  <span>{project.year}</span>
                </div>
                <div className="v5-project-illustration" aria-hidden="true">
                  <span className="v5-art-shadow" />
                  <span className="v5-art-core" />
                  <span className="v5-art-shine" />
                  <span className="v5-art-orbit" />
                </div>
                <div className="v5-project-info">
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                  </div>
                  <span className="v5-project-arrow" aria-hidden="true">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="v5-about" id="about" aria-labelledby="v5-about-title">
        <div className="v5-shell v5-about-grid">
          <div className="v5-about-copy">
            <span className="v5-section-kicker">{t.aboutEyebrow}</span>
            <h2 id="v5-about-title">{t.aboutTitleA}<br /><em>{t.aboutTitleB}</em></h2>
            <p className="v5-about-body">{t.aboutBody}</p>
            <p className="v5-about-aside">{t.aboutNote}</p>
          </div>
          <div className="v5-about-visual">
            <div className="v5-about-disc" aria-hidden="true"><span /><i /></div>
            <div className="v5-about-skills">
              {t.areas.map((area, index) => (
                <div key={area}><span>0{index + 1}</span><span>{area}</span><span aria-hidden="true">↗</span></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="v5-contact" id="contact">
        <div className="v5-shell">
          <span className="v5-section-kicker">{t.contactEyebrow}</span>
          <h2>{t.contactTitleA}<br /><span>{t.contactTitleB}</span></h2>
          <p>{t.contactLead}</p>
          <a className="v5-email-action" href={'mailto:' + email}>
            {t.emailMe} <span aria-hidden="true">↗</span>
          </a>
          <div className="v5-contact-meta">
            <a href={'/' + locale + '/portfolio-v5'} className="v5-footer-brand">YF<span>✳</span></a>
            <span>{t.copyright}</span>
            <div className="v5-socials">
              <a href="https://www.linkedin.com/in/yotam-faraggi" target="_blank" rel="noopener noreferrer">{t.linkedIn} ↗</a>
              <a href="https://github.com/yotamon" target="_blank" rel="noopener noreferrer">{t.github} ↗</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
