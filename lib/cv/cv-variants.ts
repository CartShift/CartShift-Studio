import {
  getEnglishCVData,
  type CVData,
  type CVExperienceItem,
  type CVExperienceKey,
  type CVSkillGroup,
  type CVSkillKey,
} from './cv-data';

export const cvVariantIds = ['product-ai', 'fullstack-healthcare', 'product-frontend'] as const;

export type CVVariantId = (typeof cvVariantIds)[number];

export interface CVVariantDefinition {
  id: CVVariantId;
  label: string;
  filename: string;
  headline: string;
}

export const cvVariantDefinitions: Record<CVVariantId, CVVariantDefinition> = {
  'product-ai': {
    id: 'product-ai',
    label: 'Product AI',
    filename: 'yotam-faraggi-senior-product-engineer-ai-cv.pdf',
    headline: 'Senior Product Engineer | AI & Full-Stack Products',
  },
  'fullstack-healthcare': {
    id: 'fullstack-healthcare',
    label: 'Full-Stack Healthcare',
    filename: 'yotam-faraggi-senior-full-stack-healthcare-cv.pdf',
    headline: 'Senior Full-Stack Engineer | Healthcare & Cloud Products',
  },
  'product-frontend': {
    id: 'product-frontend',
    label: 'Product Frontend',
    filename: 'yotam-faraggi-senior-product-engineer-react-cv.pdf',
    headline: 'Senior Product Engineer | React & Full-Stack Web Products',
  },
};

function cloneExperience(experience: CVExperienceItem): CVExperienceItem {
  return {
    ...experience,
    highlights: [...experience.highlights],
  };
}

function cloneSkill(skill: CVSkillGroup): CVSkillGroup {
  return {
    ...skill,
    items: [...skill.items],
  };
}

function cloneCVData(): CVData {
  const base = getEnglishCVData();
  const experiences = base.experiences.map(cloneExperience);
  const byKey = new Map(experiences.map(experience => [experience.key, experience]));

  return {
    ...base,
    contact: { ...base.contact },
    labels: { ...base.labels },
    sections: { ...base.sections },
    summary: { ...base.summary },
    portfolio: {
      ...base.portfolio,
      projects: base.portfolio.projects.map(project => ({
        ...project,
        signals: [...project.signals],
      })),
      clients: { ...base.portfolio.clients },
    },
    experiences,
    recentExperiences: base.recentExperiences.map(experience => byKey.get(experience.key)!),
    earlierExperiences: base.earlierExperiences.map(experience => byKey.get(experience.key)!),
    skills: base.skills.map(cloneSkill),
    education: base.education.map(entry => ({ ...entry })),
    languages: base.languages.map(language => ({ ...language })),
  };
}

function updateExperience(
  cv: CVData,
  key: CVExperienceKey,
  update: Partial<Omit<CVExperienceItem, 'key'>>
) {
  const experience = cv.experiences.find(item => item.key === key);
  if (!experience) return;

  Object.assign(experience, update);
  if (update.highlights) experience.highlights = [...update.highlights];
}

function getSkill(cv: CVData, key: CVSkillKey) {
  return cv.skills.find(skill => skill.key === key);
}

function reorderSkills(cv: CVData, order: CVSkillKey[]) {
  const index = new Map(order.map((key, position) => [key, position]));
  cv.skills.sort((a, b) => (index.get(a.key) ?? 999) - (index.get(b.key) ?? 999));
}

function buildProductAIVariant() {
  const cv = cloneCVData();
  cv.headline = cvVariantDefinitions['product-ai'].headline;
  cv.summary.text =
    'Senior Product Engineer with more than 10 years of experience building customer-facing web products and internal systems across e-commerce, healthcare, fintech, and enterprise software. Full-stack across React, Next.js, TypeScript, Node.js, APIs, integrations, cloud infrastructure, and PostgreSQL, with a strong focus on turning practical product needs into reliable software. Recent work includes AI-assisted workflow tools, headless e-commerce, telemedicine, and third-party integrations, with ownership from technical planning through deployment and ongoing improvement.';
  cv.summary.metaDescription =
    'Senior Product Engineer in Berlin building full-stack web products, AI-assisted workflows, integrations, and reliable customer-facing software.';

  updateExperience(cv, 'cartshift', {
    highlights: [
      'Build and ship Shopify storefronts and headless e-commerce experiences using Next.js, React, TypeScript, and modern web tooling.',
      'Develop AI-assisted workflow tools and internal utilities that automate operational tasks.',
      'Take projects from requirements and technical planning through implementation, deployment, and iterative improvement for international clients.',
    ],
  });

  const productEngineering = getSkill(cv, 'productEngineering');
  if (productEngineering) {
    productEngineering.items = [
      'Technical scoping',
      'System design',
      'API design',
      'Customer-facing product development',
      'Reliability',
      'Performance optimization',
      'Web application architecture',
    ];
  }

  const aiAutomation = getSkill(cv, 'aiAutomation');
  if (aiAutomation) {
    aiAutomation.items = [
      'OpenAI API',
      'Claude API',
      'LangChain',
      'Webhooks',
      'Puppeteer',
      'Playwright',
    ];
  }

  reorderSkills(cv, [
    'productEngineering',
    'aiAutomation',
    'frontendFullStack',
    'cloudData',
    'commerceIntegrations',
    'legacyEnterprise',
  ]);

  return cv;
}

function buildHealthcareVariant() {
  const cv = cloneCVData();
  cv.headline = cvVariantDefinitions['fullstack-healthcare'].headline;
  cv.summary.text =
    'Senior Full-Stack Engineer with more than 10 years of experience building web products, integrations, and production systems, including more than four years working on customer-facing healthcare and telemedicine software. Strong across React, Next.js, TypeScript, Node.js, API design, cloud infrastructure, and data systems, with hands-on experience building a HIPAA-compliant telemedicine funnel on Google Cloud Platform. Focused on privacy, reliability, maintainability, and translating operational requirements into dependable software.';
  cv.summary.metaDescription =
    'Senior Full-Stack Engineer in Berlin with healthcare, telemedicine, cloud, API, integration, and privacy-conscious product experience.';

  updateExperience(cv, 'curalife', {
    description:
      'Worked across customer-facing telemedicine and e-commerce systems, integrations, frontend modernization, and cloud infrastructure in a healthcare environment.',
    highlights: [
      'Built and maintained a HIPAA-compliant telemedicine funnel using Next.js, React, TypeScript, and Google Cloud Platform.',
      'Worked across customer-facing telemedicine and e-commerce systems, integrations, frontend modernization, and cloud infrastructure.',
      'Built Shopify and HubSpot integrations supporting customer and operational workflows.',
      'Built and deployed cloud infrastructure with a focus on privacy, reliability, and maintainability.',
    ],
  });

  updateExperience(cv, 'cartshift', {
    highlights: [
      'Build full-stack web and e-commerce products using Next.js, React, TypeScript, and modern web tooling.',
      'Develop workflow automation tools and internal utilities for operational tasks.',
      'Handle projects from requirements and technical planning through implementation, deployment, and ongoing improvement.',
    ],
  });

  const productEngineering = getSkill(cv, 'productEngineering');
  if (productEngineering) {
    productEngineering.category = 'Healthcare & Reliability';
    productEngineering.items = [
      'HIPAA-compliant telemedicine',
      'Privacy',
      'Reliability',
      'Maintainability',
      'API design',
      'Customer-facing workflows',
      'System design',
    ];
  }

  reorderSkills(cv, [
    'productEngineering',
    'frontendFullStack',
    'commerceIntegrations',
    'cloudData',
    'aiAutomation',
    'legacyEnterprise',
  ]);

  return cv;
}

function buildProductFrontendVariant() {
  const cv = cloneCVData();
  cv.headline = cvVariantDefinitions['product-frontend'].headline;
  cv.summary.text =
    'Senior Product Engineer with more than 10 years of experience building customer-facing web products, with a strong center of gravity in modern frontend development and full-stack delivery. Deep experience with React, Next.js, TypeScript, JavaScript, performance optimization, API integrations, and web application architecture, backed by hands-on work with Node.js, PostgreSQL, Google Cloud Platform, and Vercel. Built telemedicine, e-commerce, and high-traffic web experiences from requirements and technical planning through deployment and continuous improvement.';
  cv.summary.metaDescription =
    'Senior Product Engineer in Berlin specializing in React, Next.js, TypeScript, frontend architecture, full-stack delivery, and customer-facing web products.';

  updateExperience(cv, 'cartshift', {
    highlights: [
      'Build Shopify storefronts and headless e-commerce experiences using Next.js, React, TypeScript, and modern web tooling.',
      'Take customer-facing projects from requirements and technical planning through implementation, deployment, and ongoing improvement.',
      'Develop AI-assisted workflow tools and internal utilities for operational tasks.',
    ],
  });

  updateExperience(cv, 'curalife', {
    highlights: [
      'Led migration work toward a modern frontend stack and improved key customer-facing flows.',
      'Built and maintained a HIPAA-compliant telemedicine funnel using Next.js, React, TypeScript, and Google Cloud Platform.',
      'Built Shopify and HubSpot integrations supporting customer-facing and operational workflows.',
      'Built and deployed cloud infrastructure with a focus on privacy, reliability, and maintainability.',
    ],
  });

  const frontend = getSkill(cv, 'frontendFullStack');
  if (frontend) {
    frontend.category = 'Frontend & Primary Stack';
    frontend.items = [
      'React',
      'Next.js',
      'TypeScript',
      'JavaScript',
      'Tailwind CSS',
      'Framer Motion',
      'Node.js',
    ];
  }

  const productEngineering = getSkill(cv, 'productEngineering');
  if (productEngineering) {
    productEngineering.items = [
      'Technical scoping',
      'Web application architecture',
      'System design',
      'Customer-facing product development',
      'Performance optimization',
      'Reliability',
      'API design',
    ];
  }

  reorderSkills(cv, [
    'frontendFullStack',
    'productEngineering',
    'commerceIntegrations',
    'cloudData',
    'aiAutomation',
    'legacyEnterprise',
  ]);

  return cv;
}

export function getCVDataForVariant(variant: CVVariantId): CVData {
  switch (variant) {
    case 'product-ai':
      return buildProductAIVariant();
    case 'fullstack-healthcare':
      return buildHealthcareVariant();
    case 'product-frontend':
      return buildProductFrontendVariant();
  }
}
