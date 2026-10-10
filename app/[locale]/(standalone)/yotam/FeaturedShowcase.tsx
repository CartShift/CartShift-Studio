import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { PortfolioShowcaseProject } from '@/lib/portfolio-showcase';

type Props = {
  project: PortfolioShowcaseProject;
  locale: string;
  isHebrew: boolean;
};

/**
 * An image-led editorial project feature.
 * Mobile reading order: project identity → actual product → evidence and actions.
 */
export default function FeaturedShowcase({ project, locale, isHebrew }: Props) {
  const copy = isHebrew
    ? {
        label: 'עבודה נבחרת',
        category: 'מוצר עצמאי · פיתוח מקצה לקצה',
        statement:
          'מטרות, פרויקטים ומשימות במרחב עבודה ויזואלי אחד, עם סוכן AI שמסוגל לפעול בתוך המוצר.',
        evidence: 'החלטה הנדסית',
        preview: 'הצצה למוצר',
        caseStudy: 'לסיפור הפרויקט',
        more: 'לעוד פרויקטים',
      }
    : {
        label: 'Selected work',
        category: 'Founder-built · End-to-end engineering',
        statement:
          'Goals, projects and tasks in one visual workspace, with an AI agent that can take action inside the product.',
        evidence: 'Engineering decision',
        preview: 'Product preview',
        caseStudy: 'Explore the case study',
        more: 'More projects',
      };

  const projectHref = '/' + locale + '/portfolio/' + project.slug;

  return (
    <section
      id="work"
      aria-labelledby="yotam-featured-title"
      className="yotam-featured px-5 sm:px-8 lg:px-12"
    >
      <div className="yotam-featured-shell mx-auto max-w-[1500px]">
        <div className="yotam-featured-sectionline">
          <span>{copy.label} <span className="yotam-featured-index">/ {project.number}</span></span>
          <span>{project.year}</span>
        </div>

        <div className="yotam-featured-grid">
          <div className="yotam-featured-intro">
            <p className="yotam-featured-category">{copy.category}</p>
            <h2 id="yotam-featured-title" className="yotam-featured-title">
              {project.title}<span aria-hidden="true" className="yotam-featured-period">.</span>
            </h2>
            <p className="yotam-featured-statement">{copy.statement}</p>
          </div>

          <a
            className="yotam-featured-visual group"
            href={projectHref}
            aria-label={copy.caseStudy + ': ' + project.title}
          >
            <div className="yotam-featured-visual-top">
              <span>{copy.preview}</span>
              <span className="yotam-featured-visual-arrow"><ArrowUpRight className="size-5" /></span>
            </div>
            <div className="yotam-featured-screen">
              {project.hero ? (
                <img
                  src={project.hero.src}
                  alt={project.hero.alt}
                  loading="lazy"
                  decoding="async"
                  className={project.hero.contain ? 'object-contain' : 'object-cover'}
                />
              ) : (
                <span className="yotam-featured-fallback">{project.title}</span>
              )}
            </div>
            <div className="yotam-featured-visual-foot">
              <span>{project.descriptor}</span>
              <span>{project.status}</span>
            </div>
          </a>

          <div className="yotam-featured-details">
            <div className="yotam-featured-evidence">
              <span className="yotam-featured-evidence-label">{copy.evidence}</span>
              <p>{project.highlights[0]}</p>
            </div>
            <div className="yotam-featured-actions">
              <a href={projectHref} className="yotam-featured-primary">
                {copy.caseStudy} <ArrowUpRight className="size-[18px]" />
              </a>
              <a href="#more-work" className="yotam-featured-secondary">
                {copy.more} <ArrowDownRight className="size-[18px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
