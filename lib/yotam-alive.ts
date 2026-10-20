import { z } from 'zod';
import { getPortfolioShowcases, portfolioShowcaseOrder } from '@/lib/portfolio-showcase';

export const aliveProjectSlugs = portfolioShowcaseOrder;
export type AliveProjectSlug = (typeof aliveProjectSlugs)[number];
export type AliveLocale = 'en' | 'he';
export type AliveView = 'none' | 'work' | 'project' | 'architecture';

const slugSchema = z.enum([...aliveProjectSlugs, 'none'] as const);
export const aliveDirectiveSchema = z.object({
  answer: z.string().min(1).max(1600),
  project: slugSchema,
  view: z.enum(['none', 'work', 'project', 'architecture']),
}).strict();

export type AliveDirective = z.infer<typeof aliveDirectiveSchema>;
export type AliveMessage = { role: 'user' | 'assistant'; content: string };

export function portfolioKnowledge(locale: AliveLocale) {
  return getPortfolioShowcases(locale).map(project => ({
    slug: project.slug,
    title: project.title,
    descriptor: project.descriptor,
    status: project.status,
    year: project.year,
    summary: project.summary,
    audience: project.audience,
    role: project.role,
    technologies: project.technologies,
    highlights: project.highlights,
    liveUrl: project.liveUrl ?? null,
    repositoryUrl: project.repositoryUrl ?? null,
  }));
}

/**
 * Transparent, deterministic discovery when paid AI is not enabled.
 * Never invent a response or present keyword matching as an AI conversation.
 */
export function guidedPortfolioAnswer(question: string, locale: AliveLocale): AliveDirective {
  const q = question.toLowerCase();
  const projects = getPortfolioShowcases(locale);
  const found = projects.find(project =>
    q.includes(project.title.toLowerCase()) ||
    q.includes(project.slug.replace('-studio', '')) ||
    (project.slug === 'wakemyway' && /alarm|android|השכמה|שעון/.test(q)) ||
    (project.slug === 'rightflow' && /document|verification|pension|מסמכ|אימות|פנסי/.test(q)) ||
    (project.slug === 'starlinker' && /ai|agent|graph|סוכן|בינה|ארכיטקטור|architecture/.test(q)) ||
    (project.slug === 'ensemblis' && /music|artist|release|מוזיק|אמנ/.test(q)) ||
    (project.slug === 'cartshift-studio' && /commerce|shopify|business|מסחר|חנות/.test(q))
  );
  if (found) {
    return {
      answer: locale === 'he'
        ? `${found.title}: ${found.summary} התפקיד של יותם: ${found.role}. נקודות הנדסיות מתועדות: ${found.highlights.join(' · ')}.`
        : `${found.title}: ${found.summary} Yotam's role: ${found.role}. Documented engineering highlights: ${found.highlights.join(' · ')}.`,
      project: found.slug as AliveProjectSlug,
      view: /architecture|ארכיטקטור|how|איך|trade.?off|decision|החלט/.test(q) ? 'architecture' : 'project',
    };
  }
  if (/team|responsib|experience|hire|skills|הצוות|ניסיון|יכולות|תפקיד/.test(q)) {
    const studio = projects.find(project => project.slug === 'cartshift-studio')!;
    return {
      answer: locale === 'he'
        ? `יותם הוביל את ההנדסה וארכיטקטורת המוצר ב-${studio.title}. תחומי האחריות המתועדים כוללים: ${studio.highlights.join(' · ')}. בחרו פרויקט בצד כדי לראות עוד.`
        : `Yotam is the lead engineer and product architect behind ${studio.title}. Documented responsibilities include ${studio.highlights.join(' · ')}. Choose a project to see more.`,
      project: 'cartshift-studio',
      view: 'project',
    };
  }
  return {
    answer: locale === 'he'
      ? 'זהו מצב סיור מודרך המבוסס על פרויקטים פומביים, לא תשובת AI חופשית. אפשר לבחור למטה פרויקט או לשאול על AI, מסמכים, Android, מסחר או מוזיקה.'
      : 'This is a guided tour of publicly documented projects, not a free-form AI response. Choose a project below, or ask about AI, documents, Android, commerce or music.',
    project: 'none',
    view: 'work',
  };
}
