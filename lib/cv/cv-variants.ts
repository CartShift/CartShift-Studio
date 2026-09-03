import {
  getEnglishCVData,
  type CVData,
  type CVExperienceItem,
  type CVExperienceKey,
  type CVSkillGroup,
  type CVSkillKey,
} from './cv-data';

export const cvVariantIds = [
  'product-ai',
  'fullstack-healthcare',
  'product-frontend',
  'n26-backend',
] as const;

export type CVVariantId = (typeof cvVariantIds)[number];

export const CANONICAL_CV_IDENTITY = 'Senior Full-Stack Engineer | Product & AI';

export interface CVVariantDefinition {
  id: CVVariantId;
  label: string;
  filename: string;
  focus: string;
}

export const cvVariantDefinitions: Record<CVVariantId, CVVariantDefinition> = {
  'product-ai': {
    id: 'product-ai',
    label: 'Product AI',
    filename: 'yotam-faraggi-senior-full-stack-engineer-product-ai-cv.pdf',
    focus: 'AI-Assisted Products, Automation & Integrations',
  },
  'fullstack-healthcare': {
    id: 'fullstack-healthcare',
    label: 'Full-Stack Healthcare',
    filename: 'yotam-faraggi-senior-full-stack-engineer-healthcare-cv.pdf',
    focus: 'Cloud Platforms, APIs & Integrations',
  },
  'product-frontend': {
    id: 'product-frontend',
    label: 'Product Frontend',
    filename: 'yotam-faraggi-senior-full-stack-engineer-frontend-cv.pdf',
    focus: 'React, Product UX & Web Performance',
  },
  'n26-backend': {
    id: 'n26-backend',
    label: 'N26',
    filename: 'yotam-faraggi-senior-full-stack-engineer-n26-cv.pdf',
    focus: 'Systems, APIs & Integrations',
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

function applyPositioning(cv: CVData, variant: CVVariantId) {
  cv.headline = `${CANONICAL_CV_IDENTITY}\n${cvVariantDefinitions[variant].focus}`;
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
  applyPositioning(cv, 'product-ai');
  cv.summary.text =
    'Senior Full-Stack Engineer with more than 10 years of experience building customer-facing web products and internal systems across e-commerce, healthcare, fintech, and enterprise software. Full-stack across React, Next.js, TypeScript, Node.js, APIs, integrations, cloud infrastructure, and PostgreSQL, with a strong focus on turning practical product needs into reliable software. Recent work includes AI-assisted workflow tools, headless e-commerce, telemedicine, and third-party integrations, with ownership from technical planning through deployment and ongoing improvement.';
  cv.summary.metaDescription =
    'Senior Full-Stack Engineer in Berlin building product-focused web applications, AI-assisted workflows, integrations, and reliable customer-facing software.';

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
  applyPositioning(cv, 'fullstack-healthcare');
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
  applyPositioning(cv, 'product-frontend');
  cv.summary.text =
    'Senior Full-Stack Engineer with more than 10 years of experience building customer-facing web products, with a strong center of gravity in modern frontend development and full-stack delivery. Deep experience with React, Next.js, TypeScript, JavaScript, performance optimization, API integrations, and web application architecture, backed by hands-on work with Node.js, PostgreSQL, Google Cloud Platform, and Vercel. Built telemedicine, e-commerce, and high-traffic web experiences from requirements and technical planning through deployment and continuous improvement.';
  cv.summary.metaDescription =
    'Senior Full-Stack Engineer in Berlin with deep React, Next.js, TypeScript, frontend architecture, API integration, and customer-facing product experience.';

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

function buildN26BackendVariant() {
  const cv = cloneCVData();
  applyPositioning(cv, 'n26-backend');
  cv.summary.text =
    'Senior Full-Stack Engineer with more than 10 years of experience building production software across banking, fintech, healthcare, and e-commerce. Backend and integration experience includes high-availability banking services, high-throughput web services, event-driven messaging with JMS, REST APIs and third-party integrations, Node.js and TypeScript, PostgreSQL, Docker, CI/CD, and Google Cloud Platform. Combines hands-on system design and delivery with product ownership, taking work from technical scoping through deployment and ongoing improvement.';
  cv.summary.metaDescription =
    'Berlin-based Senior Full-Stack Engineer with banking, fintech, API, integration, cloud, event-driven messaging, and production systems experience.';

  updateExperience(cv, 'cartshift', {
    description:
      'Independent product and web development studio focused on production web applications, integrations, and workflow automation for international clients.',
    highlights: [
      'Build and ship production applications and backend workflows using TypeScript, Node.js, Next.js, third-party APIs, webhooks, and modern web tooling.',
      'Own architecture and integration decisions from requirements and technical planning through deployment and iterative improvement.',
      'Develop AI-assisted workflow tools and automations that integrate LLM APIs with external services and operational processes.',
    ],
  });

  updateExperience(cv, 'curalife', {
    description:
      'Worked across customer-facing telemedicine and e-commerce systems, backend integrations, cloud infrastructure, and technical leadership.',
    highlights: [
      'Built and maintained a HIPAA-compliant telemedicine funnel using Next.js, React, TypeScript, and Google Cloud Platform, connecting customer-facing flows with backend services.',
      'Designed and integrated third-party healthcare and eligibility APIs supporting dynamic customer and operational workflows.',
      'Built Shopify and HubSpot integrations supporting customer-facing and operational processes.',
      'Led technical modernization and cloud deployment work with a focus on privacy, reliability, and maintainability.',
    ],
  });

  updateExperience(cv, 'paragonex', {
    description:
      'Built and maintained production integrations and high-traffic web systems for fintech affiliate operations.',
    highlights: [
      'Built integrations between affiliate systems and core fintech platform services.',
      'Developed and optimized high-traffic web applications using Laravel, Sage, and WordPress with a focus on performance and maintainability.',
    ],
  });

  updateExperience(cv, 'ecommerce_venture', {
    highlights: [
      'Built and operated direct-to-consumer systems spanning storefronts, payments, fulfillment, analytics, integrations, and day-to-day operations.',
    ],
  });

  updateExperience(cv, 'hot', {
    highlights: [
      'Built enterprise integrations and high-throughput web services using Oracle OSB, WebLogic, IBM DataPower, and JMS queues.',
      'Used asynchronous JMS messaging to connect services and operational systems in production environments.',
    ],
  });

  updateExperience(cv, 'leumi', {
    highlights: [
      'Developed and maintained high-availability banking integrations using IBM WebSphere ESB, IBM Integration Bus, and IBM DataPower.',
      'Worked on production services connecting banking systems with a focus on reliability and operational continuity.',
    ],
  });

  const productEngineering = getSkill(cv, 'productEngineering');
  if (productEngineering) {
    productEngineering.category = 'Backend & Product Engineering';
    productEngineering.items = [
      'System design',
      'API design',
      'Technical scoping',
      'Production systems',
      'Reliability',
      'Performance optimization',
      'End-to-end ownership',
    ];
  }

  const cloudData = getSkill(cv, 'cloudData');
  if (cloudData) {
    cloudData.category = 'Cloud & Delivery';
    cloudData.items = [
      'Google Cloud Platform',
      'Docker',
      'GitHub Actions',
      'CI/CD',
      'PostgreSQL',
      'Firebase',
      'Vercel',
    ];
  }

  const integrations = getSkill(cv, 'commerceIntegrations');
  if (integrations) {
    integrations.category = 'APIs, Integrations & Messaging';
    integrations.items = [
      'REST APIs',
      'GraphQL',
      'Webhooks',
      'JMS',
      'IBM Integration Bus',
      'Oracle OSB',
      'IBM DataPower',
    ];
  }

  const fullStack = getSkill(cv, 'frontendFullStack');
  if (fullStack) {
    fullStack.category = 'Backend & Full-Stack';
    fullStack.items = [
      'Node.js',
      'TypeScript',
      'JavaScript',
      'Next.js',
      'React',
      'PostgreSQL',
    ];
  }

  const enterprise = getSkill(cv, 'legacyEnterprise');
  if (enterprise) {
    enterprise.category = 'Enterprise & Banking Systems';
    enterprise.items = [
      'IBM WebSphere ESB',
      'IBM Integration Bus',
      'Oracle OSB',
      'WebLogic',
      'IBM DataPower',
      'JMS',
      'C++',
    ];
  }

  reorderSkills(cv, [
    'productEngineering',
    'cloudData',
    'commerceIntegrations',
    'frontendFullStack',
    'legacyEnterprise',
    'aiAutomation',
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
    case 'n26-backend':
      return buildN26BackendVariant();
  }
}