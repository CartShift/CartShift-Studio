import { z } from 'zod';
import {
  experienceKeys,
  portfolioProjectKeys,
  skillKeys,
  type CVData,
  type CVExperienceKey,
  type CVPortfolioProjectKey,
  type CVSkillKey,
} from './cv-data';
import {
  cvVariantIds,
  resolveCVVariant,
  type CVVariantId,
  type ResolvedCVVariant,
} from './cv-variants';

const shortText = z.string().trim().min(1).max(220);
const paragraphText = z.string().trim().min(1).max(1800);
const bulletText = z.string().trim().min(1).max(560);
const skillText = z.string().trim().min(1).max(100);

const experienceOverrideSchema = z
  .object({
    description: z.string().trim().max(1200).optional(),
    highlights: z.array(bulletText).max(6).optional(),
  })
  .strict();

const skillOverrideSchema = z
  .object({
    category: z.string().trim().min(1).max(120).optional(),
    items: z.array(skillText).max(14).optional(),
  })
  .strict();

export const cvTailoringInputSchema = z
  .object({
    baseVariant: z.enum(cvVariantIds).default('default'),
    filename: z
      .string()
      .trim()
      .min(5)
      .max(180)
      .refine(value => value.toLowerCase().endsWith('.pdf'), 'filename must end in .pdf')
      .optional(),
    label: shortText.optional(),
    title: shortText.optional(),
    headline: shortText.optional(),
    summary: z
      .object({
        text: paragraphText.optional(),
        metaDescription: z.string().trim().min(1).max(420).optional(),
      })
      .strict()
      .optional(),
    experienceOrder: z.array(z.enum(experienceKeys)).max(experienceKeys.length).optional(),
    experienceOverrides: z.record(z.string(), experienceOverrideSchema).optional(),
    skillOrder: z.array(z.enum(skillKeys)).max(skillKeys.length).optional(),
    skillOverrides: z.record(z.string(), skillOverrideSchema).optional(),
    portfolioProjectOrder: z
      .array(z.enum(portfolioProjectKeys))
      .max(portfolioProjectKeys.length)
      .optional(),
  })
  .strict();

export type CVTailoringInput = z.infer<typeof cvTailoringInputSchema>;

const experienceKeySet = new Set<string>(experienceKeys);
const skillKeySet = new Set<string>(skillKeys);

function assertKnownOverrideKeys(input: CVTailoringInput) {
  for (const key of Object.keys(input.experienceOverrides ?? {})) {
    if (!experienceKeySet.has(key)) {
      throw new Error(`Unknown CV experience key: ${key}`);
    }
  }

  for (const key of Object.keys(input.skillOverrides ?? {})) {
    if (!skillKeySet.has(key)) {
      throw new Error(`Unknown CV skill key: ${key}`);
    }
  }
}

function orderByKey<T extends { key: K }, K extends string>(items: readonly T[], order?: readonly K[]) {
  if (!order) return [...items];

  const unique = new Set(order);
  if (unique.size !== order.length) {
    throw new Error('CV tailoring order lists cannot contain duplicate keys');
  }

  const byKey = new Map(items.map(item => [item.key, item] as const));
  const ordered = order.map(key => {
    const item = byKey.get(key);
    if (!item) throw new Error(`Missing CV item for key: ${key}`);
    return item;
  });

  for (const item of items) {
    if (!unique.has(item.key)) ordered.push(item);
  }

  return ordered;
}

export function parseCVTailoringInput(value: unknown): CVTailoringInput {
  const parsed = cvTailoringInputSchema.parse(value);
  assertKnownOverrideKeys(parsed);
  return parsed;
}

export function resolveTailoredCV(rawInput: unknown): ResolvedCVVariant {
  const input = parseCVTailoringInput(rawInput);
  const base = resolveCVVariant(input.baseVariant as CVVariantId);
  const recentKeys = new Set(base.cv.recentExperiences.map(item => item.key));
  const earlierKeys = new Set(base.cv.earlierExperiences.map(item => item.key));

  const experiences = orderByKey(
    base.cv.experiences.map(experience => {
      const override = input.experienceOverrides?.[experience.key];
      if (!override) return experience;

      return {
        ...experience,
        description: override.description ?? experience.description,
        highlights: override.highlights ? [...override.highlights] : [...experience.highlights],
      };
    }),
    input.experienceOrder as CVExperienceKey[] | undefined
  );

  const skills = orderByKey(
    base.cv.skills.map(skill => {
      const override = input.skillOverrides?.[skill.key];
      if (!override) return skill;

      return {
        ...skill,
        category: override.category ?? skill.category,
        items: override.items ? [...override.items] : [...skill.items],
      };
    }),
    input.skillOrder as CVSkillKey[] | undefined
  );

  const projects = orderByKey(
    base.cv.portfolio.projects,
    input.portfolioProjectOrder as CVPortfolioProjectKey[] | undefined
  );

  const cv: CVData = {
    ...base.cv,
    title: input.title ?? base.cv.title,
    headline: input.headline ?? base.cv.headline,
    summary: {
      ...base.cv.summary,
      ...input.summary,
    },
    experiences,
    recentExperiences: experiences.filter(item => recentKeys.has(item.key)),
    earlierExperiences: experiences.filter(item => earlierKeys.has(item.key)),
    skills,
    portfolio: {
      ...base.cv.portfolio,
      projects,
    },
  };

  return {
    id: base.id,
    label: input.label ?? `${base.label} tailored`,
    filename: input.filename ?? base.filename,
    cv,
  };
}
