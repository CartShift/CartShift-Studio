import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { buildCVData } from '@/lib/cv/cv-data';
import { CV_STATIC_DOWNLOAD_PATH } from '@/lib/cv/cv-static';
import englishCv from '@/messages/src/en/cv.json';
import hebrewCv from '@/messages/src/he/cv.json';
import V5Navigation from '../V5Navigation';
import '../portfolio-v5-experience.css';

type Locale = 'en' | 'he';
type Props = { params: Promise<{ locale: string }> };

const pageCopy = {
  en: {
    kicker: '03 / The path so far',
    titleTop: 'The work',
    titleBottom: 'behind the work.',
    intro: 'Over a decade of building production software — from enterprise integrations to customer-facing products, and now independent engineering.',
    jump: 'Explore the timeline',
    current: '01 / Recent experience',
    currentTitle: 'Where ideas meet execution.',
    currentIntro: 'Hands-on ownership across product, engineering, systems and delivery.',
    early: '02 / The foundations',
    earlyTitle: 'Built on a solid foundation.',
    earlyIntro: 'Enterprise engineering, entrepreneurial experiments and the systems work that shaped how I build today.',
    contribution: 'Selected contributions',
    skills: '03 / What I bring',
    skillsTitle: 'Tools change. Thinking stays.',
    education: 'Education',
    languages: 'Languages',
    next: '04 / What comes next',
    nextTitle: 'The best work is still ahead.',
    nextIntro: 'Have a product to build, a complex system to rethink, or a team looking for someone who cares about the details?',
    contact: 'Start a conversation',
    explore: 'Explore selected work',
    download: 'Download résumé',
    period: 'Period',
    back: 'Home',
  },
  he: {
    kicker: '03 / הדרך עד כאן',
    titleTop: 'הניסיון',
    titleBottom: 'שמאחורי העשייה.',
    intro: 'יותר מעשור של בניית תוכנה לפרודקשן — ממערכות אינטגרציה ארגוניות דרך מוצרים ללקוחות ועד לפיתוח עצמאי.',
    jump: 'לציר הקריירה',
    current: '01 / ניסיון עדכני',
    currentTitle: 'בין רעיון לביצוע.',
    currentIntro: 'אחריות מקצה לקצה על מוצר, הנדסה, מערכות ומסירה.',
    early: '02 / היסודות',
    earlyTitle: 'יש בסיס מאחורי כל רעיון.',
    earlyIntro: 'הנדסה ארגונית, יוזמות עצמאיות ועבודה על מערכות מורכבות שעיצבו את הדרך שבה אני בונה היום.',
    contribution: 'תחומי אחריות והישגים',
    skills: '03 / מה אני מביא איתי',
    skillsTitle: 'הכלים משתנים. החשיבה נשארת.',
    education: 'השכלה',
    languages: 'שפות',
    next: '04 / מה הלאה',
    nextTitle: 'הדברים הטובים עוד לפנינו.',
    nextIntro: 'יש מוצר לבנות, מערכת מורכבת לחשוב עליה מחדש או צוות שמחפש מישהו שאכפת לו מהפרטים?',
    contact: 'בואו נדבר',
    explore: 'לעבודות נבחרות',
    download: 'הורדת קורות חיים',
    period: 'תקופה',
    back: 'ראשי',
  },
} as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const lang: Locale = locale === 'he' ? 'he' : 'en';
  return {
    title: { absolute: lang === 'he' ? 'ניסיון מקצועי | יותם פרג׳י' : 'Experience | Yotam Faraggi' },
    description: lang === 'he'
      ? 'המסלול המקצועי של יותם פרג׳י — פיתוח מוצר, Full-Stack, אינטגרציות, בריאות, פינטק ומסחר.'
      : 'The professional journey of Yotam Faraggi across product engineering, full-stack development, healthcare, fintech and commerce.',
    robots: { index: false, follow: false },
  };
}

export default async function V5ExperiencePage({ params }: Props) {
  const { locale } = await params;
  const lang: Locale = locale === 'he' ? 'he' : 'en';
  setRequestLocale(lang);

  // Reuse the same translated, reviewed professional data as the public master CV.
  // Editing the CV records updates this page without duplicating employers or dates.
  const cv = buildCVData(lang === 'he' ? hebrewCv.cv : englishCv.cv);
  const t = pageCopy[lang];
  const home = '/' + lang + '/portfolio-v5';
  const rtl = lang === 'he';

  return (
    <main className="v5-page v5-experience" dir={rtl ? 'rtl' : 'ltr'}>
      <a className="v5-skip-link" href="#v5-experience-content">{rtl ? 'דלג לתוכן' : 'Skip to content'}</a>
      <V5Navigation locale={lang} section="experience" />

      <section className="v5-exp-hero" aria-labelledby="v5-experience-content">
        <div className="v5-exp-orbit v5-exp-orbit--one" aria-hidden="true"><span /></div>
        <div className="v5-exp-orbit v5-exp-orbit--two" aria-hidden="true"><span /></div>
        <div className="v5-exp-hero-inner v5-shell">
          <span className="v5-exp-overline">{t.kicker}</span>
          <h1 id="v5-experience-content" tabIndex={-1}>
            <span>{t.titleTop}</span>
            <em>{t.titleBottom}</em>
          </h1>
          <div className="v5-exp-intro">
            <p>{t.intro}</p>
            <a href="#experience-timeline">{t.jump}<span aria-hidden="true">↘</span></a>
          </div>
        </div>
        <div className="v5-exp-hero-foot v5-shell" aria-hidden="true">
          <span>2011 — {rtl ? 'היום' : 'Now'}</span>
          <span>YF / EXPERIENCE</span>
        </div>
      </section>

      <section className="v5-exp-recent v5-shell" id="experience-timeline" aria-labelledby="v5-recent-title">
        <div className="v5-exp-section-head">
          <div>
            <span className="v5-exp-kicker">{t.current}</span>
            <h2 id="v5-recent-title">{t.currentTitle}</h2>
          </div>
          <p>{t.currentIntro}</p>
        </div>
        <ol className="v5-exp-timeline">
          {cv.recentExperiences.map((job, index) => (
            <li key={job.key} className="v5-exp-job">
              <div className="v5-exp-marker">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span className="v5-exp-dot" aria-hidden="true" />
              </div>
              <article className="v5-exp-job-body">
                <div className="v5-exp-job-head">
                  <div>
                    <p className="v5-exp-job-company" dir="auto">{job.company}</p>
                    <h3 dir="auto">{job.title}</h3>
                    {job.location && <p className="v5-exp-job-location">{job.location}</p>}
                  </div>
                  <p className="v5-exp-job-period" aria-label={t.period} dir="auto">{job.duration}</p>
                </div>
                {job.description && <p className="v5-exp-job-description">{job.description}</p>}
                <div className="v5-exp-highlights">
                  <p>{t.contribution}</p>
                  <ul>{job.highlights.map((highlight, i) => (
                    <li key={i}>{highlight}</li>
                  ))}</ul>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className="v5-exp-early" aria-labelledby="v5-early-title">
        <div className="v5-shell">
          <div className="v5-exp-section-head">
            <div>
              <span className="v5-exp-kicker">{t.early}</span>
              <h2 id="v5-early-title">{t.earlyTitle}</h2>
            </div>
            <p>{t.earlyIntro}</p>
          </div>
          <ol className="v5-exp-early-list">
            {cv.earlierExperiences.map((job, index) => (
              <li className="v5-exp-early-item" key={job.key}>
                <span className="v5-exp-early-number">{String(index + 4).padStart(2, '0')}</span>
                <div>
                  <h3 dir="auto">{job.company}</h3>
                  <p dir="auto">{job.title}</p>
                </div>
                <span className="v5-exp-early-date" dir="auto">{job.duration}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="v5-exp-capabilities" aria-labelledby="v5-exp-skills-title">
        <div className="v5-shell">
          <span className="v5-exp-kicker">{t.skills}</span>
          <h2 id="v5-exp-skills-title">{t.skillsTitle}</h2>
          <div className="v5-exp-skills">
            {cv.skills.map((group, index) => (
              <div className="v5-exp-skill" key={group.key}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h3>{group.category}</h3>
                <p>{group.items.join(' / ')}</p>
              </div>
            ))}
          </div>
          <div className="v5-exp-additional">
            <div>
              <h3>{t.education}</h3>
              {cv.education.map((item, index) => (
                <div className="v5-exp-additional-item" key={index}>
                  <strong>{item.institution}</strong>
                  <span>{item.program}{item.years ? ' · ' + item.years : ''}</span>
                </div>
              ))}
            </div>
            <div>
              <h3>{t.languages}</h3>
              {cv.languages.map(item => (
                <div className="v5-exp-additional-item" key={item.key}>
                  <strong>{item.name}</strong><span>{item.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="v5-exp-outro" aria-labelledby="v5-exp-outro-title">
        <div className="v5-exp-outro-art" aria-hidden="true" />
        <div className="v5-shell">
          <span className="v5-exp-kicker">{t.next}</span>
          <h2 id="v5-exp-outro-title">{t.nextTitle}</h2>
          <p>{t.nextIntro}</p>
          <div className="v5-exp-actions">
            <Link href={home + '/contact'} prefetch={false}>{t.contact}<span aria-hidden="true">↗</span></Link>
            <Link href={home + '/work'} prefetch={false}>{t.explore}<span aria-hidden="true">↗</span></Link>
            <a href={CV_STATIC_DOWNLOAD_PATH} download>{t.download}<span aria-hidden="true">↓</span></a>
          </div>
        </div>
      </section>
      <footer className="v5-subpage-footer v5-shell">
        <Link href={home} prefetch={false}>YF<span>✳</span></Link>
        <span>© {new Date().getFullYear()} · Yotam Faraggi</span>
        <Link href={home} prefetch={false}>{t.back} ↗</Link>
      </footer>
    </main>
  );
}
