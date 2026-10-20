import Image from 'next/image';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';
import { translations, type PortfolioV5Locale } from './v5-copy';
import V5Navigation from './V5Navigation';

type Kind = 'work' | 'about' | 'contact';
type Props = { locale: PortfolioV5Locale; kind: Kind; email: string };

export default function PortfolioV5Detail({ locale, kind, email }: Props) {
  const t = translations[locale];
  const isHebrew = locale === 'he';
  const homeHref = '/' + locale;
  const portfolioHref = homeHref + '/portfolio-v5';
  const projects = kind === 'work' ? getPortfolioShowcases(locale) : [];

  return (
    <main className={'v5-page v5-subpage v5-subpage--' + kind} dir={isHebrew ? 'rtl' : 'ltr'}>
      <a className="v5-skip-link" href="#v5-content">
        {isHebrew ? 'דלג לתוכן' : 'Skip to content'}
      </a>
      <V5Navigation locale={locale} section={kind} />
      <div id="v5-content" className="v5-subpage-main" tabIndex={-1}>
        {kind === 'work' && (
          <>
            <section className="v5-inner-hero v5-shell">
              <div className="v5-inner-heading">
                <span className="v5-section-kicker">{t.workEyebrow}</span>
                <h1>{isHebrew ? 'עבודות.' : 'Work.'}<sup aria-label={isHebrew ? projects.length + ' פרויקטים' : projects.length + ' projects'}>{projects.length.toString().padStart(2, '0')}</sup></h1>
                <p>{t.workLead}</p>
              </div>
            </section>
            <section className="v5-list-section v5-shell" aria-label={t.work}>
              <div className="v5-list-caption">
                <span>{isHebrew ? 'נבחרים' : 'Selected projects'}</span>
                <span>{isHebrew ? 'לחצו לצפייה' : 'Click to explore'}</span>
              </div>
              <div className="v5-work-list">
                {projects.map((project, index) => (
                  <a href={'/' + locale + '/portfolio/' + project.slug} className="v5-work-row" key={project.slug}>
                    <span className="v5-work-count">{(index + 1).toString().padStart(2, '0')}</span>
                    <div>
                      <h2>{project.title}</h2>
                      <p>{project.descriptor}</p>
                    </div>
                    <span className={'v5-work-row-preview v5-work-row-preview--' + (index % 4)} aria-hidden="true">
                      {project.hero?.src.startsWith('/') ? (
                        <Image src={project.hero.src} alt="" fill
                          unoptimized={project.hero.src.startsWith('http')}
                          sizes="(max-width: 680px) 48px, 140px"
                          className="v5-work-row-image" />
                      ) : (
                        <span className="v5-work-row-fallback">{project.title.slice(0, 2)}<span aria-hidden="true">✳</span></span>
                      )}
                    </span>
                    <span className="v5-work-year">{project.year}</span>
                    <span className="v5-work-row-arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {kind === 'about' && (
          <section className="v5-inner-about v5-shell">
            <div className="v5-about-grid">
              <div className="v5-about-copy">
                <span className="v5-section-kicker">{t.aboutEyebrow}</span>
                <h1>{t.aboutTitleA}<br /><em>{t.aboutTitleB}</em></h1>
                <p className="v5-about-body">{t.aboutBody}</p>
                <p className="v5-about-aside">{t.aboutNote}</p>
                <div className="v5-about-extras">
                  <a href={portfolioHref + '/experience'} className="v5-inline-link">
                    {isHebrew ? 'לצפייה בקורות החיים' : 'Explore my experience'} <span aria-hidden="true">↗</span>
                  </a>
                  <a href={portfolioHref + '/contact'} className="v5-inline-link">
                    {t.contact} <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
              <div className="v5-about-visual">
                <div className="v5-about-disc" aria-hidden="true"><span /><i /></div>
                <div className="v5-about-skills">
                  {t.areas.map((area, index) => (
                    <div key={area}>
                      <span>0{index + 1}</span><span>{area}</span><span aria-hidden="true">↗</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {kind === 'contact' && (
          <section className="v5-inner-contact v5-shell">
            <div className="v5-inner-contact-sculpture" aria-hidden="true" />
            <span className="v5-section-kicker">{t.contactEyebrow}</span>
            <h1>{t.contactTitleA}<br /><span>{t.contactTitleB}</span></h1>
            <p>{t.contactLead}</p>
            <a className="v5-email-action" href={'mailto:' + email}>
              {t.emailMe} <span aria-hidden="true">↗</span>
            </a>
            <div className="v5-contact-links">
              <a href="https://www.linkedin.com/in/yotam-faraggi" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              <a href="https://github.com/yotamon" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
              <a href={homeHref}>{t.home} ↗</a>
            </div>
          </section>
        )}
      </div>
      <footer className="v5-subpage-footer v5-shell">
        <a href={homeHref}>YF<span>✳</span></a>
        <span>© {new Date().getFullYear()} · {t.copyright}</span>
        <a href={portfolioHref + '/contact'}>{isHebrew ? 'לדבר איתי' : 'Get in touch'} ↗</a>
      </footer>
    </main>
  );
}
