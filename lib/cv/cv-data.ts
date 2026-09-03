import enMessages from '@/messages/src/en/cv.json';

export const CV_PDF_FILENAME = 'yotam-faraggi-senior-full-stack-engineer-cv.pdf';

export const experienceKeys = [
  'cartshift',
  'curalife',
  'paragonex',
  'ecommerce_venture',
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
] as const;

export const recentExperienceKeys = [
  'cartshift',
  'curalife',
  'paragonex',
  'ecommerce_venture',
] as const;

export const earlierExperienceKeys = [
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
] as const;

export const skillKeys = [
  'frontendFullStack',
  'commerceIntegrations',
  'productEngineering',
  'cloudData',
  'aiAutomation',
  'legacyEnterprise',
] as const;

export const languageKeys = ['hebrew', 'english', 'german'] as const;

export const portfolioProjectKeys = ['cartshift', 'rightflow', 'starlinker', 'atlasIrwin'] as const;

export type CVExperienceKey = (typeof experienceKeys)[number];
export type CVSkillKey = (typeof skillKeys)[number];
export type CVLanguageKey = (typeof languageKeys)[number];
export type CVPortfolioProjectKey = (typeof portfolioProjectKeys)[number];

export interface CVExperienceItem {
  key: CVExperienceKey;
  company: string;
  title: string;
  duration: string;
  durationYears?: string;
  location?: string;
  description?: string;
  highlights: string[];
}

export interface CVSkillGroup {
  key: CVSkillKey;
  category: string;
  items: string[];
}

export interface CVLanguageItem {
  key: CVLanguageKey;
  name: string;
  level: string;
}

export interface CVPortfolioProject {
  key: CVPortfolioProjectKey;
  eyebrow: string;
  description: string;
  signals: string[];
}

export interface CVEducationEntry {
  institution: string;
  program: string;
  years?: string;
  description?: string;
}

export interface CVData {
  title: string;
  name: string;
  headline: string;
  location: string;
  workAuthorization: string;
  phone: string;
  email: string;
  contact: {
    linkedinLabel: string;
    githubLabel: string;
    portfolioLabel: string;
    linkedinUrl: string;
    githubUrl: string;
    portfolioUrl: string;
    portfolioDisplayUrl: string;
  };
  labels: {
    saveAsPdf: string;
    preparingPdf: string;
    earlierExperience: string;
  };
  sections: {
    summary: string;
    portfolio: string;
    experience: string;
    skills: string;
    education: string;
    languages: string;
  };
  summary: {
    text: string;
    metaDescription: string;
  };
  portfolio: {
    intro: string;
    liveLabel: string;
    featuredLabel: string;
    visitProject: string;
    projects: CVPortfolioProject[];
    clients: {
      kicker: string;
      title: string;
      description: string;
      cta: string;
    };
  };
  experiences: CVExperienceItem[];
  recentExperiences: CVExperienceItem[];
  earlierExperiences: CVExperienceItem[];
  skills: CVSkillGroup[];
  education: CVEducationEntry[];
  languages: CVLanguageItem[];
}

export interface RawCVMessages {
  title: string;
  name: string;
  subtitle: string;
  location: string;
  workAuthorization: string;
  phone: string;
  email: string;
  linkedin: string;
  github: string;
  portfolioLink: string;
  saveAsPdf: string;
  preparingPdf: string;
  sections: CVData['sections'];
  labels: {
    earlierExperience: string;
  };
  portfolio: {
    intro: string;
    liveLabel: string;
    featuredLabel: string;
    visitProject: string;
    projects: Record<
      CVPortfolioProjectKey,
      {
        eyebrow: string;
        description: string;
        signals: string[];
      }
    >;
    clients: CVData['portfolio']['clients'];
  };
  summary: CVData['summary'];
  experience: Record<
    CVExperienceKey,
    {
      company: string;
      title: string;
      duration: string;
      durationYears?: string;
      location?: string;
      description?: string;
      highlights: string[];
    }
  >;
  skills: Record<
    CVSkillKey,
    {
      category: string;
      items: string[];
    }
  >;
  education: {
    entries: CVEducationEntry[];
  };
  languageSkills: Record<
    CVLanguageKey,
    {
      name: string;
      level: string;
    }
  >;
}

export function buildCVData(cv: RawCVMessages): CVData {
  const experiences = experienceKeys.map(key => ({
    key,
    ...cv.experience[key],
  }));

  return {
    title: cv.title,
    name: cv.name,
    headline: cv.subtitle,
    location: cv.location,
    workAuthorization: cv.workAuthorization,
    phone: cv.phone,
    email: cv.email,
    contact: {
      linkedinLabel: cv.linkedin,
      githubLabel: cv.github,
      portfolioLabel: cv.portfolioLink,
      linkedinUrl: 'https://linkedin.com/in/yotam-faraggi',
      githubUrl: 'https://github.com/yotamon',
      portfolioUrl: 'https://cart-shift.com/en/cv',
      portfolioDisplayUrl: 'cart-shift.com/en/cv',
    },
    labels: {
      saveAsPdf: cv.saveAsPdf,
      preparingPdf: cv.preparingPdf,
      earlierExperience: cv.labels.earlierExperience,
    },
    sections: cv.sections,
    summary: cv.summary,
    portfolio: {
      intro: cv.portfolio.intro,
      liveLabel: cv.portfolio.liveLabel,
      featuredLabel: cv.portfolio.featuredLabel,
      visitProject: cv.portfolio.visitProject,
      projects: portfolioProjectKeys.map(key => ({
        key,
        ...cv.portfolio.projects[key],
      })),
      clients: cv.portfolio.clients,
    },
    experiences,
    recentExperiences: experiences.filter(experience =>
      recentExperienceKeys.includes(experience.key as (typeof recentExperienceKeys)[number])
    ),
    earlierExperiences: experiences.filter(experience =>
      earlierExperienceKeys.includes(experience.key as (typeof earlierExperienceKeys)[number])
    ),
    skills: skillKeys.map(key => ({
      key,
      ...cv.skills[key],
    })),
    education: cv.education.entries,
    languages: languageKeys.map(key => ({
      key,
      ...cv.languageSkills[key],
    })),
  };
}

export function getEnglishCVData() {
  return buildCVData(enMessages.cv);
}
