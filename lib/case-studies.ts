import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const caseStudiesDirectory = path.join(process.cwd(), 'content/case-studies');

export interface CaseStudyBrand {
  primary: string;
  accent?: string;
  logo?: string;
}

export interface CaseStudyHero {
  image: string;
  alt: string;
  supportingCopy?: string;
}

export interface CaseStudyOverview {
  title: string;
  summary: string;
}

export interface CaseStudyDeliverable {
  title: string;
  description: string;
}

export interface CaseStudyGalleryItem {
  image: string;
  alt: string;
  caption: string;
}

export interface CaseStudyResult {
  metric: string;
  before: string;
  after: string;
  improvement: string;
}

export interface CaseStudyEvidence {
  title: string;
  value?: string;
  description: string;
  before?: string;
  after?: string;
  tone?: 'qualitative' | 'quantitative';
}

export interface CaseStudyTestimonial {
  quote: string;
  author: string;
  role: string;
}

export interface CaseStudyMeta {
  slug: string;
  title: string;
  client: string;
  industry: string;
  platform: string;
  duration?: string;
  featured: boolean;
  siteUrl?: string;
  brand: CaseStudyBrand;
  hero: CaseStudyHero;
  overview: CaseStudyOverview;
  thumbnail: string;
  heroImage: string;
  summary: string;
  results: CaseStudyResult[];
  services: string[];
  deliverables: CaseStudyDeliverable[];
  gallery: CaseStudyGalleryItem[];
  evidence: CaseStudyEvidence[];
  testimonial?: CaseStudyTestimonial;
}

export interface CaseStudy extends CaseStudyMeta {
  content: string;
}

// Interface for Hebrew translations in frontmatter
interface HebrewTranslation {
  title?: string;
  summary?: string;
  industry?: string;
  duration?: string;
  hero?: Partial<CaseStudyHero>;
  overview?: Partial<CaseStudyOverview>;
  results?: CaseStudyResult[];
  services?: string[];
  deliverables?: CaseStudyDeliverable[];
  gallery?: CaseStudyGalleryItem[];
  evidence?: CaseStudyEvidence[];
  testimonial?: CaseStudyTestimonial;
  content?: string;
}

interface CaseStudyFrontmatter {
  slug?: string;
  title?: string;
  client?: string;
  industry?: string;
  platform?: string;
  duration?: string;
  featured?: boolean;
  siteUrl?: string;
  brand?: Partial<CaseStudyBrand>;
  hero?: Partial<CaseStudyHero>;
  overview?: Partial<CaseStudyOverview>;
  thumbnail?: string;
  heroImage?: string;
  summary?: string;
  results?: CaseStudyResult[];
  services?: string[];
  deliverables?: CaseStudyDeliverable[];
  gallery?: CaseStudyGalleryItem[];
  evidence?: CaseStudyEvidence[];
  testimonial?: CaseStudyTestimonial;
  he?: HebrewTranslation;
}

function normalizeGalleryWithHero(
  gallery: CaseStudyGalleryItem[],
  hero: CaseStudyHero,
  fallbackCaption: string
): CaseStudyGalleryItem[] {
  const dedupedGallery = gallery.filter(item => item.image && item.image !== hero.image);

  if (!hero.image) {
    return dedupedGallery;
  }

  return [
    {
      image: hero.image,
      alt: hero.alt,
      caption: hero.supportingCopy || fallbackCaption || hero.alt,
    },
    ...dedupedGallery,
  ];
}

function mergeLocalizedObject<T extends object>(
  base: T | undefined,
  localized: Partial<T> | undefined
): T | undefined {
  if (!base && !localized) {
    return undefined;
  }

  return {
    ...(base || {}),
    ...(localized || {}),
  } as T;
}

function getFallbackBrand(platform: string): CaseStudyBrand {
  return platform.toLowerCase().includes('shopify')
    ? {
        primary: '#94a23d',
        accent: '#e7f08f',
      }
    : {
        primary: '#2b5d99',
        accent: '#84b7ff',
      };
}

function normalizeLegacyEvidence(results: CaseStudyResult[]): CaseStudyEvidence[] {
  return results.map(result => {
    const stateSummary =
      result.before && result.after
        ? `Before: ${result.before}. After: ${result.after}.`
        : result.after
          ? `Current state: ${result.after}.`
          : result.improvement;

    return {
      title: result.metric,
      value: result.improvement,
      description: stateSummary,
      before: result.before,
      after: result.after,
      tone: 'qualitative',
    };
  });
}

export function normalizeCaseStudyRecord(
  data: CaseStudyFrontmatter,
  content: string,
  locale: string,
  slug: string
): CaseStudy {
  const isHebrew = locale === 'he';
  const heTranslations: HebrewTranslation = data.he || {};

  const title = (isHebrew && heTranslations.title) || data.title || '';
  const summary = (isHebrew && heTranslations.summary) || data.summary || '';
  const industry = (isHebrew && heTranslations.industry) || data.industry || '';
  const duration = (isHebrew && heTranslations.duration) || data.duration || '';
  const services = (isHebrew && heTranslations.services) || data.services || [];
  const results = (isHebrew && heTranslations.results) || data.results || [];
  const testimonial = (isHebrew && heTranslations.testimonial) || data.testimonial;
  const hero = mergeLocalizedObject<CaseStudyHero>(
    data.hero as CaseStudyHero | undefined,
    isHebrew ? heTranslations.hero : undefined
  );
  const overview = mergeLocalizedObject<CaseStudyOverview>(
    data.overview as CaseStudyOverview | undefined,
    isHebrew ? heTranslations.overview : undefined
  );
  const deliverables = (isHebrew && heTranslations.deliverables) || data.deliverables || [];
  const gallery = (isHebrew && heTranslations.gallery) || data.gallery || [];
  const evidence = (isHebrew && heTranslations.evidence) || data.evidence || [];
  const brand = {
    ...getFallbackBrand(data.platform || ''),
    ...(data.brand || {}),
  };

  const resolvedHeroImage = hero?.image || data.heroImage || data.thumbnail || '';
  const resolvedThumbnail = resolvedHeroImage || data.thumbnail || '';
  const resolvedOverview = overview || {
    title: isHebrew ? 'תקציר הפרויקט' : 'Project Overview',
    summary,
  };
  const resolvedHero = hero || {
    image: resolvedHeroImage,
    alt: title,
    supportingCopy: summary,
  };
  const resolvedGallery = normalizeGalleryWithHero(gallery, resolvedHero, summary);
  const resolvedEvidence = evidence.length > 0 ? evidence : normalizeLegacyEvidence(results);

  return {
    slug,
    title,
    client: data.client || '',
    industry,
    platform: data.platform || '',
    duration,
    featured: data.featured || false,
    siteUrl: data.siteUrl || '',
    brand,
    hero: resolvedHero,
    overview: resolvedOverview,
    thumbnail: resolvedThumbnail,
    heroImage: resolvedHeroImage,
    summary,
    results,
    services,
    deliverables,
    gallery: resolvedGallery,
    evidence: resolvedEvidence,
    testimonial,
    content: (isHebrew && heTranslations.content) || content,
  };
}

function getCaseStudyFiles(): string[] {
  try {
    if (!fs.existsSync(caseStudiesDirectory)) {
      return [];
    }
    return fs.readdirSync(caseStudiesDirectory).filter(file => file.endsWith('.md'));
  } catch {
    return [];
  }
}

export function getCaseStudySlugs(): string[] {
  return getCaseStudyFiles().map(file => file.replace(/\.md$/, ''));
}

export function getCaseStudyBySlug(slug: string, locale: string = 'en'): CaseStudy | null {
  try {
    const fullPath = path.join(caseStudiesDirectory, `${slug}.md`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return normalizeCaseStudyRecord(data as CaseStudyFrontmatter, content, locale, slug);
  } catch (error) {
    console.error(`Error reading case study ${slug}:`, error);
    return null;
  }
}

export function getAllCaseStudies(locale: string = 'en'): CaseStudyMeta[] {
  const slugs = getCaseStudySlugs();
  const caseStudies = slugs
    .map(slug => {
      const study = getCaseStudyBySlug(slug, locale);
      if (!study) return null;

      // Return metadata only (without full content)
      const { content: _, ...meta } = study;
      return meta;
    })
    .filter((study): study is CaseStudyMeta => study !== null);

  return caseStudies.sort(
    (a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title, locale)
  );
}

export function getFeaturedCaseStudies(locale: string = 'en'): CaseStudyMeta[] {
  return getAllCaseStudies(locale).filter(study => study.featured);
}

export function getCaseStudiesByIndustry(industry: string, locale: string = 'en'): CaseStudyMeta[] {
  return getAllCaseStudies(locale).filter(
    study => study.industry.toLowerCase() === industry.toLowerCase()
  );
}

export function getCaseStudiesByPlatform(platform: string, locale: string = 'en'): CaseStudyMeta[] {
  return getAllCaseStudies(locale).filter(study =>
    study.platform.toLowerCase().includes(platform.toLowerCase())
  );
}
