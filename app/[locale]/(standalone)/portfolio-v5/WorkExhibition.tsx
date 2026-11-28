import Image from 'next/image';
import { ArrowDownRight, ArrowUpRight, Github } from 'lucide-react';
import type { PortfolioShowcaseProject } from '@/lib/portfolio-showcase';

type Props = { projects: PortfolioShowcaseProject[]; locale: 'en' | 'he' };

const editorialCopy: Record<string, { en: string; he: string }> = {
  starlinker: { en: 'Make the connections visible.', he: 'להפוך את הקשרים לגלויים.' },
  pileheads: { en: 'The card table, reinvented for the browser.', he: 'שולחן הקלפים, מחדש בדפדפן.' },
  rightflow: { en: 'From document chaos to explainable decisions.', he: 'מערימות מסמכים להחלטות שאפשר להסביר.' },
  wakemyway: { en: 'A better beginning to the day.', he: 'התחלה טובה יותר ליום.' },
  'cartshift-studio': { en: 'The infrastructure behind a working studio.', he: 'התשתית שמפעילה סטודיו אמיתי.' },
  ensemblis: { en: 'An operating system for the independent artist.', he: 'מערכת הפעלה לאמן העצמאי.' },
};

function Exhibit({ project, locale, featured }: { project: PortfolioShowcaseProject; locale: Props['locale']; featured: boolean }) {
  const he = locale === 'he';
  const href = '/' + locale + '/yotam/work/' + project.slug;
  const companion = project.slug === 'wakemyway' ? project.gallery[2]
    : project.slug === 'pileheads' ? project.gallery[1]
    : undefined;
  return (
    <article className={'work-exhibit' + (featured ? ' work-exhibit--featured' : '')} data-work-project={project.slug}>
      <a href={href} className="work-exhibit-visual" aria-label={(he ? 'לסיפור הפרויקט: ' : 'Explore case study: ') + project.title}>
        <div className="work-exhibit-visual-top">
          <span>{project.number} / {project.year}</span>
          <span>{project.hero?.label}</span>
        </div>
        <div className={'work-exhibit-stage' + (companion ? ' work-exhibit-stage--pair' : '')}>
          {project.hero ? (
            <Image src={project.hero.src} alt={project.hero.alt} fill
              unoptimized={/^https?:\/\//.test(project.hero.src)}
              sizes={featured ? '(max-width: 760px) 90vw, 55vw' : '(max-width: 760px) 90vw, 44vw'}
              className={'work-exhibit-image' + (project.hero.aspect === 'portrait' ? ' work-exhibit-image--portrait' : '')} />
          ) : <span className="work-exhibit-fallback">{project.title}</span>}
          {companion && <Image src={companion.src} alt="" fill sizes="(max-width: 760px) 28vw, 18vw" className="work-exhibit-companion" />}
        </div>
        <div className="work-exhibit-visual-bottom">
          <span>{project.status}</span><ArrowUpRight aria-hidden="true" size={22} />
        </div>
      </a>
      <div className="work-exhibit-story">
        <p className="work-exhibit-kicker">{featured ? (he ? 'פרויקט דגל' : 'Flagship project') : (he ? 'מוצר נבחר' : 'Selected product')} / {project.descriptor}</p>
        <h2><a href={href}>{project.title}</a></h2>
        <p className="work-exhibit-headline">{editorialCopy[project.slug]?.[locale] ?? project.descriptor}</p>
        <p className="work-exhibit-description">{project.summary}</p>
        <div className="work-exhibit-proof">
          <span>{he ? 'האתגר ההנדסי' : 'Engineering focus'}</span>
          <p>{project.highlights[0]}</p>
        </div>
        <ul className="work-exhibit-stack" aria-label={he ? 'טכנולוגיות' : 'Technologies'}>
          {project.technologies.slice(0, 4).map(tech => <li key={tech}>{tech}</li>)}
        </ul>
        <div className="work-exhibit-actions">
          <a className="work-exhibit-primary" href={href}>{he ? 'לסיפור הפרויקט' : 'Explore case study'} <ArrowUpRight size={17} aria-hidden="true" /></a>
          {project.liveUrl && <a className="work-exhibit-secondary" href={project.liveUrl} target="_blank" rel="noreferrer">{project.slug === 'pileheads' ? (he ? 'לשחק' : 'Play online') : (he ? 'למוצר' : 'Live product')} <ArrowUpRight size={15} aria-hidden="true" /></a>}
          {project.repositoryUrl && <a className="work-exhibit-secondary" href={project.repositoryUrl} target="_blank" rel="noreferrer"><Github size={16} aria-hidden="true" /> GitHub</a>}
        </div>
      </div>
    </article>
  );
}

export default function WorkExhibition({ projects, locale }: Props) {
  const he = locale === 'he';
  const featured = projects.filter(project => ['starlinker', 'pileheads'].includes(project.slug));
  const other = projects.filter(project => !featured.includes(project));
  return (
    <div className="work-exhibition v5-shell">
      <section className="work-exhibition-intro" aria-labelledby="work-exhibition-title">
        <div className="work-exhibition-eyebrow"><span>{he ? 'פורטפוליו / עבודות נבחרות' : 'PORTFOLIO / SELECTED WORK'}</span><span>2025–2026</span></div>
        <div className="work-exhibition-intro-grid">
          <h1 id="work-exhibition-title">{he ? <>רעיונות.<br /><em>מוצרים אמיתיים.</em></> : <>Ideas.<br /><em>Made real.</em></>}</h1>
          <div className="work-exhibition-intro-copy">
            <p>{he ? 'ממחשבה ראשונה ועד לשורת הקוד האחרונה. מוצרים עצמאיים שמחברים בין עיצוב, הנדסה והבנה של אנשים.' : 'From first principles to working software. Independent products at the intersection of design, engineering and human needs.'}</p>
            <a href="#work-exhibits" className="work-exhibition-jump">{he ? 'לכל העבודות' : 'Explore the work'} <ArrowDownRight aria-hidden="true" size={20} /></a>
          </div>
        </div>
        <div className="work-exhibition-index"><span>{String(projects.length).padStart(2, '0')} / {he ? 'מוצרים נבחרים' : 'SELECTED PRODUCTS'}</span><span>{he ? 'ברלין / פיתוח מוצר מקצה לקצה' : 'BERLIN / END-TO-END PRODUCT ENGINEERING'}</span></div>
      </section>
      <section id="work-exhibits" aria-label={he ? 'פרויקטי דגל' : 'Flagship projects'} className="work-exhibition-featured">
        {featured.map(project => <Exhibit key={project.slug} project={project} locale={locale} featured />)}
      </section>
      <section className="work-exhibition-collection" aria-labelledby="work-collection-title">
        <div className="work-exhibition-section-head"><h2 id="work-collection-title">{he ? 'עוד עולמות שבניתי.' : 'More worlds I built.'}</h2><span>{he ? 'מוצרים, לא רק קוד' : 'PRODUCTS, NOT JUST CODE'}</span></div>
        <div className="work-exhibition-grid">{other.map(project => <Exhibit key={project.slug} project={project} locale={locale} featured={false} />)}</div>
      </section>
      <section className="work-exhibition-contact">
        <p>{he ? 'רוצה לדעת איך אני חושב ועובד?' : 'Curious how I think and work?'}</p>
        <a href={'/' + locale + '/yotam/contact'}>{he ? 'בואו נדבר.' : "Let's talk."} <ArrowUpRight size={32} aria-hidden="true" /></a>
      </section>
    </div>
  );
}
