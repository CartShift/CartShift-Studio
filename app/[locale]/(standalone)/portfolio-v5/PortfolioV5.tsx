'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

type Props = { locale: 'en' | 'he'; email: string };

const featuredSlugs = ['starlinker', 'rightflow', 'cartshift-studio', 'ensemblis'];

const translations = {
  en: {
    skip: 'Skip to selected work',
    home: 'Home',
    work: 'Work',
    about: 'About',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
    experiment: 'Portfolio experiment / No. 05',
    availability: 'Based in Berlin · Available for the right challenge',
    hello: "Hey, I'm",
    name: 'Yotam Faraggi.',
    bridge: 'I turn big ideas into',
    payoff: 'real products.',
    intro: 'Senior product engineer, full-stack developer & curious maker. From first sketch to real-world software.',
    seeWork: 'See my projects',
    seeAbout: 'More about me',
    scroll: 'Scroll to explore',
    workEyebrow: '01 / Selected work',
    workTitle: 'Made to work. Built to last.',
    workLead: 'Different challenges, one approach: thoughtful product decisions and the engineering to make them real.',
    caseStudy: 'Explore project',
    aboutEyebrow: '02 / A little about me',
    aboutTitleA: 'Curiosity is',
    aboutTitleB: 'my favorite tool.',
    aboutBody: 'I am a Berlin-based product engineer who likes working at the intersection of design, technology and people. I turn ambiguity into useful software, care deeply about craft, and stay involved long after the first release.',
    aboutNote: 'A little technical. A little creative. Always hands-on.',
    areas: ['Product thinking', 'Full-stack engineering', 'AI & automations', 'Commerce systems'],
    contactEyebrow: '03 / What comes next?',
    contactTitleA: "Let's make",
    contactTitleB: 'something good.',
    contactLead: 'Have a challenging idea, an interesting team or a collaboration in mind? I would love to hear about it.',
    emailMe: 'Start a conversation',
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    copyright: 'Designed & built as an original exploration',
    motionOn: 'Pause motion',
    motionOff: 'Resume motion',
    switchLanguage: 'Switch to Hebrew',
    menuNav: 'Portfolio navigation',
  },
  he: {
    skip: 'דלג לעבודות הנבחרות',
    home: 'ראשי',
    work: 'עבודות',
    about: 'עליי',
    contact: 'יצירת קשר',
    menu: 'תפריט',
    close: 'סגירה',
    experiment: 'ניסוי פורטפוליו / מס׳ 05',
    availability: 'מבוסס בברלין · פתוח לאתגרים מעניינים',
    hello: 'היי, אני',
    name: 'יותם פרג׳י.',
    bridge: 'הופך רעיונות גדולים',
    payoff: 'למוצרים אמיתיים.',
    intro: 'Senior Product Engineer, מפתח Full-stack ויוצר סקרן. מהרעיון הראשון ועד לתוכנה שעובדת בעולם האמיתי.',
    seeWork: 'לפרויקטים שלי',
    seeAbout: 'עוד קצת עליי',
    scroll: 'גללו כדי לגלות',
    workEyebrow: '01 / עבודות נבחרות',
    workTitle: 'נראה טוב. עובד באמת.',
    workLead: 'אתגרים שונים, גישה אחת: החלטות מוצר חכמות ועומק הנדסי שמביא אותן למציאות.',
    caseStudy: 'לפרויקט',
    aboutEyebrow: '02 / קצת עליי',
    aboutTitleA: 'סקרנות היא',
    aboutTitleB: 'כלי העבודה שלי.',
    aboutBody: 'אני מהנדס מוצר שחי בברלין ועובד בנקודת המפגש בין עיצוב, טכנולוגיה ואנשים. אוהב להפוך אי־ודאות לתוכנה שימושית, להשקיע בפרטים, ולהישאר מעורב הרבה אחרי ההשקה.',
    aboutNote: 'קצת טכנולוגי. קצת יצירתי. תמיד מעשי.',
    areas: ['חשיבה מוצרית', 'פיתוח Full-stack', 'AI ואוטומציות', 'מערכות מסחר'],
    contactEyebrow: '03 / מה הלאה?',
    contactTitleA: 'בואו נבנה',
    contactTitleB: 'משהו טוב.',
    contactLead: 'יש לכם רעיון מורכב, צוות מעניין או הזדמנות לשיתוף פעולה? אשמח לשמוע.',
    emailMe: 'מתחילים לדבר',
    linkedIn: 'LinkedIn',
    github: 'GitHub',
    copyright: 'עוצב ונבנה כניסוי מקורי',
    motionOn: 'עצירת אנימציות',
    motionOff: 'הפעלת אנימציות',
    switchLanguage: 'Switch to English',
    menuNav: 'ניווט בפורטפוליו',
  },
} as const;

export default function PortfolioV5({ locale, email }: Props) {
  const t = translations[locale];
  const isHebrew = locale === 'he';
  const [menuOpen, setMenuOpen] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const projects = getPortfolioShowcases(locale).filter(project => featuredSlugs.includes(project.slug));
  const navigation = [
    { label: t.home, href: '#top', number: '01' },
    { label: t.work, href: '#work', number: '02' },
    { label: t.about, href: '#about', number: '03' },
    { label: t.contact, href: '#contact', number: '04' },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const firstLink = menuRef.current?.querySelector<HTMLAnchorElement>('a');
    firstLink?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = Array.from(
        menuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      toggleRef.current?.focus();
    };
  }, [menuOpen]);

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

      <header className={"v5-header" + (menuOpen ? " v5-header--open" : "")}>
        <a className="v5-brand" href="#top" aria-label={isHebrew ? 'יותם פרג׳י - ראשי' : 'Yotam Faraggi - Home'}>
          <span className="v5-brand-mark" aria-hidden="true">yf<span>✳</span></span>
          <span className="v5-brand-name">YOTAM<br />FARAGGI</span>
        </a>
        <div className="v5-header-controls">
          <a
            className="v5-language-link"
            href={'/' + (isHebrew ? 'en' : 'he') + '/portfolio-v5'}
            hrefLang={isHebrew ? 'en' : 'he'}
            lang={isHebrew ? 'en' : 'he'}
            aria-label={t.switchLanguage}
          >{isHebrew ? 'EN' : 'HE'}</a>
          <button
            className="v5-motion-button"
            type="button"
            aria-label={motionPaused ? t.motionOff : t.motionOn}
            aria-pressed={motionPaused}
            onClick={() => setMotionPaused(paused => !paused)}
            title={motionPaused ? t.motionOff : t.motionOn}
          >
            <span className={'v5-motion-indicator' + (motionPaused ? ' v5-motion-indicator--off' : '')} aria-hidden="true" />
            <span className="v5-motion-label">Motion</span>
          </button>
          <button
            className="v5-menu-toggle"
            type="button"
            ref={toggleRef}
            aria-label={menuOpen ? t.close : t.menu}
            aria-expanded={menuOpen}
            aria-controls="v5-navigation-dialog"
            onClick={() => setMenuOpen(open => !open)}
          >
            <span>{menuOpen ? t.close : t.menu}</span>
            <span className={'v5-menu-icon' + (menuOpen ? ' v5-menu-icon--open' : '')} aria-hidden="true">
              <i /><i />
            </span>
          </button>
        </div>
      </header>

      {menuOpen && (
        <div
          id="v5-navigation-dialog"
          className="v5-menu-panel"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label={t.menuNav}
        >
          <button className="v5-panel-close" type="button" onClick={() => setMenuOpen(false)}>{t.close} <span aria-hidden="true">×</span></button>
          <nav aria-label={t.menuNav}>
            {navigation.map(item => (
              <a href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>
                <span className="v5-menu-number">{item.number}</span>
                <span>{item.label}</span>
                <span aria-hidden="true" className="v5-menu-arrow">↗</span>
              </a>
            ))}
          </nav>
          <p>© {new Date().getFullYear()} · Yotam Faraggi</p>
        </div>
      )}

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
            <a href="#work"><span aria-hidden="true">↗</span>{t.seeWork}</a>
            <a href="#about"><span aria-hidden="true">↗</span>{t.seeAbout}</a>
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
            <a href="#top" className="v5-footer-brand">YF<span>✳</span></a>
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
