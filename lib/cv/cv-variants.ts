import {
  getEnglishCVData,
  type CVData,
  type CVExperienceItem,
  type CVExperienceKey,
  type CVPortfolioProjectKey,
  type CVSkillGroup,
  type CVSkillKey,
} from './cv-data';

export const cvVariantIds = [
  'default',
  'product-frontend',
  'fullstack-healthcare',
  'product-ai',
  'defense-tech',
] as const;

export type CVVariantId = (typeof cvVariantIds)[number];

type ExperienceOverride = Partial<Pick<CVExperienceItem, 'description' | 'highlights'>>;
type SkillOverride = Partial<Pick<CVSkillGroup, 'category' | 'items'>>;

export interface CVVariantConfig {
  id: CVVariantId;
  label: string;
  filename: string;
  title?: string;
  headline?: string;
  summary?: Partial<CVData['summary']>;
  experienceOrder?: readonly CVExperienceKey[];
  experienceOverrides?: Partial<Record<CVExperienceKey, ExperienceOverride>>;
  skillOrder?: readonly CVSkillKey[];
  skillOverrides?: Partial<Record<CVSkillKey, SkillOverride>>;
  portfolioProjectOrder?: readonly CVPortfolioProjectKey[];
}

export interface ResolvedCVVariant {
  id: CVVariantId;
  label: string;
  filename: string;
  cv: CVData;
}

const allExperienceKeys: readonly CVExperienceKey[] = [
  'cartshift',
  'curalife',
  'paragonex',
  'ecommerce_venture',
  'hot',
  'leumi',
  'entrepreneurship',
  'elbit',
  'airforce',
];

const productFirstSkillOrder: readonly CVSkillKey[] = [
  'productEngineering',
  'frontendFullStack',
  'commerceIntegrations',
  'cloudData',
  'aiAutomation',
  'legacyEnterprise',
];

const fullStackSkillOrder: readonly CVSkillKey[] = [
  'frontendFullStack',
  'productEngineering',
  'cloudData',
  'commerceIntegrations',
  'aiAutomation',
  'legacyEnterprise',
];

const aiSkillOrder: readonly CVSkillKey[] = [
  'aiAutomation',
  'productEngineering',
  'frontendFullStack',
  'cloudData',
  'commerceIntegrations',
  'legacyEnterprise',
];

const defenseSkillOrder: readonly CVSkillKey[] = [
  'frontendFullStack',
  'productEngineering',
  'commerceIntegrations',
  'legacyEnterprise',
  'cloudData',
  'aiAutomation',
];

const curalifeOwnershipHighlights = [
  'Defined, architected, and built Curalife’s HIPAA-compliant telemedicine acquisition product end-to-end, spanning the patient-facing flow, backend logic, integrations, cloud infrastructure, and production operations.',
  'The telemedicine product became one of Curalife’s main customer-acquisition and revenue funnels.',
  'Built and evolved customer-facing healthcare experiences with Next.js, React, TypeScript, and Google Cloud Platform, integrating healthcare, commerce, and operational systems.',
  'Led modernization of frontend architecture and production workflows with a focus on privacy, reliability, and maintainability.',
];

export const cvVariants: Record<CVVariantId, CVVariantConfig> = {
  default: {
    id: 'default',
    label: 'Default public CV',
    filename: 'yotam-faraggi-senior-full-stack-engineer-cv.pdf',
  },
  'product-frontend': {
    id: 'product-frontend',
    label: 'Product / Frontend',
    filename: 'Yotam Faraggi CV - Product Frontend - Premium 2026 V2.pdf',
    title: 'Yotam Faraggi - Senior Product Engineer CV',
    headline: 'Senior Product Engineer | React, Next.js & Full-Stack Web Products',
    summary: {
      text: 'Senior Product Engineer with 10+ years of experience building customer-facing web products across healthcare, e-commerce, fintech, and enterprise software. Strongest in React, Next.js, TypeScript, and full-stack product development, with hands-on Node.js, APIs, integrations, cloud infrastructure, and production ownership. At Curalife, defined, architected, and built the telemedicine acquisition product end-to-end, from patient-facing experience through backend systems, integrations, deployment, and ongoing operation.',
      metaDescription:
        'Senior Product Engineer in Berlin with 10+ years of React, Next.js, TypeScript, full-stack product, API, integration, and production experience.',
    },
    experienceOrder: allExperienceKeys,
    experienceOverrides: {
      curalife: {
        description:
          'Owned major customer-facing product work across telemedicine and e-commerce, from product definition and architecture through implementation, integrations, cloud infrastructure, and production operation.',
        highlights: curalifeOwnershipHighlights,
      },
    },
    skillOrder: productFirstSkillOrder,
    portfolioProjectOrder: ['starlinker', 'rightflow', 'cartshift', 'atlasIrwin'],
  },
  'fullstack-healthcare': {
    id: 'fullstack-healthcare',
    label: 'Full-Stack / Healthcare',
    filename: 'Yotam Faraggi CV - FullStack Healthcare - Premium 2026 V2.pdf',
    title: 'Yotam Faraggi - Senior Full-Stack Engineer CV',
    headline: 'Senior Full-Stack Engineer | Healthcare, APIs & Product Systems',
    summary: {
      text: 'Senior Full-Stack Engineer with 10+ years of experience building web products, APIs, integrations, and production systems, including more than four years of hands-on healthcare and telemedicine work. At Curalife, defined, architected, and built a HIPAA-compliant telemedicine acquisition product end-to-end across React and Next.js frontend flows, backend logic, external integrations, Google Cloud infrastructure, and production operation. Experienced in translating complex product and operational requirements into reliable customer-facing systems.',
      metaDescription:
        'Senior Full-Stack Engineer in Berlin with healthcare, telemedicine, React, Next.js, TypeScript, APIs, integrations, cloud, and production experience.',
    },
    experienceOrder: allExperienceKeys,
    experienceOverrides: {
      curalife: {
        description:
          'Built and owned customer-facing healthcare and e-commerce systems in a privacy-sensitive production environment, spanning frontend, backend, integrations, and cloud infrastructure.',
        highlights: curalifeOwnershipHighlights,
      },
    },
    skillOrder: fullStackSkillOrder,
    portfolioProjectOrder: ['rightflow', 'starlinker', 'cartshift', 'atlasIrwin'],
  },
  'product-ai': {
    id: 'product-ai',
    label: 'Product / AI',
    filename: 'Yotam Faraggi CV - Product AI - Premium 2026 V2.pdf',
    title: 'Yotam Faraggi - Senior Product Engineer, AI & Full-Stack CV',
    headline: 'Senior Product Engineer | AI & Full-Stack Products',
    summary: {
      text: 'Senior Product Engineer with 10+ years of experience building and shipping customer-facing software across healthcare, e-commerce, fintech, and enterprise systems. Combines React, Next.js, TypeScript, Node.js, APIs, integrations, and cloud experience with hands-on development of AI-assisted product workflows and automation. Focused on applying AI inside useful production products rather than model research, with end-to-end ownership from product definition and architecture through implementation and deployment.',
      metaDescription:
        'Senior Product Engineer in Berlin building AI-assisted and full-stack products with React, Next.js, TypeScript, Node.js, APIs, integrations, and cloud systems.',
    },
    experienceOrder: allExperienceKeys,
    experienceOverrides: {
      cartshift: {
        description:
          'Independent product and web development studio focused on full-stack products, e-commerce, workflow automation, and practical AI-assisted tools.',
        highlights: [
          'Build and ship full-stack web products using Next.js, React, TypeScript, APIs, and modern cloud tooling.',
          'Develop AI-assisted workflow tools and product experiments that use LLM APIs and automation to support real user tasks.',
          'Own projects from product definition and technical planning through implementation, deployment, iteration, and maintenance.',
        ],
      },
      curalife: {
        description:
          'Owned major customer-facing product work across telemedicine and e-commerce, spanning product definition, architecture, implementation, integrations, cloud infrastructure, and production operation.',
        highlights: curalifeOwnershipHighlights,
      },
    },
    skillOrder: aiSkillOrder,
    portfolioProjectOrder: ['starlinker', 'rightflow', 'cartshift', 'atlasIrwin'],
  },
  'defense-tech': {
    id: 'defense-tech',
    label: 'Defense / Mission Systems',
    filename: 'Yotam Faraggi CV - Defense Tech - 2026.pdf',
    title: 'Yotam Faraggi - Senior Full-Stack Engineer CV',
    headline: 'Senior Full-Stack Engineer | APIs, Integrations & Product Systems',
    summary: {
      text: 'Berlin-based Senior Full-Stack Engineer with 10+ years of experience building production software across healthcare, fintech, e-commerce, enterprise systems, and earlier defence and aviation work. Strong across React, Next.js, TypeScript, Node.js, APIs, integrations, cloud infrastructure, and PostgreSQL, with end-to-end ownership from technical scoping and architecture through deployment and iteration. Earlier engineering work included airborne and ground-control integration systems in IDF / Mamram and real-time command-and-control software for helicopter systems at Elbit Systems.',
      metaDescription:
        'Berlin-based Senior Full-Stack Engineer with 10+ years of experience across React, Next.js, TypeScript, APIs, integrations, cloud systems, and earlier defence and aviation software.',
    },
    skillOrder: defenseSkillOrder,
    skillOverrides: {
      legacyEnterprise: {
        category: 'Systems & Enterprise Integration',
        items: [
          'C++',
          'IBM Integration Bus',
          'IBM DataPower',
          'Oracle OSB',
          'WebLogic',
          'IBM WebSphere ESB',
          'JMS',
        ],
      },
    },
  },
};

function assertKnownUniqueOrder<T extends string>(
  name: string,
  order: readonly T[] | undefined,
  allowed: ReadonlySet<T>
) {
  if (!order) return;

  const seen = new Set<T>();
  for (const key of order) {
    if (!allowed.has(key)) {
      throw new Error(`CV variant ${name} references unknown key: ${key}`);
    }
    if (seen.has(key)) {
      throw new Error(`CV variant ${name} contains duplicate key: ${key}`);
    }
    seen.add(key);
  }
}

export function validateCVVariantConfig(config: CVVariantConfig) {
  if (!config.filename.toLowerCase().endsWith('.pdf')) {
    throw new Error(`CV variant ${config.id} filename must end in .pdf`);
  }

  const base = getEnglishCVData();
  const experienceKeys = new Set(base.experiences.map(item => item.key));
  const skillKeys = new Set(base.skills.map(item => item.key));
  const portfolioKeys = new Set(base.portfolio.projects.map(item => item.key));

  assertKnownUniqueOrder(config.id, config.experienceOrder, experienceKeys);
  assertKnownUniqueOrder(config.id, config.skillOrder, skillKeys);
  assertKnownUniqueOrder(config.id, config.portfolioProjectOrder, portfolioKeys);

  for (const key of Object.keys(config.experienceOverrides ?? {}) as CVExperienceKey[]) {
    if (!experienceKeys.has(key)) {
      throw new Error(`CV variant ${config.id} overrides unknown experience: ${key}`);
    }
  }

  for (const key of Object.keys(config.skillOverrides ?? {}) as CVSkillKey[]) {
    if (!skillKeys.has(key)) {
      throw new Error(`CV variant ${config.id} overrides unknown skill group: ${key}`);
    }
  }
}

function orderByKey<T extends { key: K }, K extends string>(
  items: readonly T[],
  order?: readonly K[]
): T[] {
  if (!order) return [...items];
  const byKey = new Map(items.map(item => [item.key, item] as const));
  return order.map(key => {
    const item = byKey.get(key);
    if (!item) throw new Error(`Missing CV item for key: ${key}`);
    return item;
  });
}

export function resolveCVVariant(id: CVVariantId = 'default'): ResolvedCVVariant {
  const config = cvVariants[id];
  if (!config) throw new Error(`Unknown CV variant: ${id}`);
  validateCVVariantConfig(config);

  const base = getEnglishCVData();
  const recentKeys = new Set(base.recentExperiences.map(item => item.key));
  const earlierKeys = new Set(base.earlierExperiences.map(item => item.key));

  const experiences = orderByKey(
    base.experiences.map(experience => {
      const override = config.experienceOverrides?.[experience.key];
      return {
        ...experience,
        ...override,
        highlights: override?.highlights ? [...override.highlights] : [...experience.highlights],
      };
    }),
    config.experienceOrder
  );

  const skills = orderByKey(
    base.skills.map(skill => {
      const override = config.skillOverrides?.[skill.key];
      return {
        ...skill,
        ...override,
        items: override?.items ? [...override.items] : [...skill.items],
      };
    }),
    config.skillOrder
  );

  const projects = orderByKey(base.portfolio.projects, config.portfolioProjectOrder);

  const cv: CVData = {
    ...base,
    title: config.title ?? base.title,
    headline: config.headline ?? base.headline,
    summary: {
      ...base.summary,
      ...config.summary,
    },
    experiences,
    recentExperiences: experiences.filter(item => recentKeys.has(item.key)),
    earlierExperiences: experiences.filter(item => earlierKeys.has(item.key)),
    skills,
    portfolio: {
      ...base.portfolio,
      projects,
    },
  };

  return {
    id,
    label: config.label,
    filename: config.filename,
    cv,
  };
}

export function listCVVariants() {
  return cvVariantIds.map(id => ({
    id,
    label: cvVariants[id].label,
    filename: cvVariants[id].filename,
  }));
}
