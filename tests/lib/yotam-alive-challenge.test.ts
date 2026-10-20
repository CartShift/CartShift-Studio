import { describe, expect, it } from 'vitest';
import { buildChallengePlan, challengeConstraints, classifyChallenge } from '@/lib/yotam-alive-challenge';

describe('ALIVE / Challenge Me architecture playbooks', () => {
  it('classifies real user intents without pretending to call a model', () => {
    expect(classifyChallenge('Our AI agent needs permissions')).toBe('ai');
    expect(classifyChallenge('An abandoned checkout in Shopify')).toBe('commerce');
    expect(classifyChallenge('Review and approval workflow')).toBe('workflow');
    expect(classifyChallenge('A product discovery experience')).toBe('general');
  });

  it('returns explicit architecture boundaries and risks', () => {
    const plan = buildChallengePlan('AI agent needs safe tool calls', 'en', 'reliability', 'prototype');
    expect(plan.relatedProject).toBe('starlinker');
    expect(plan.architecture).toHaveLength(3);
    expect(plan.decision.toLowerCase()).toContain('reliability');
    expect(plan.risk).toMatch(/tool misuse/i);
  });

  it('keeps the recommendations locale-aware and constraints-driven', () => {
    const plan = buildChallengePlan('תהליך אישורים למסמכים', 'he', 'privacy', 'enterprise');
    const copy = challengeConstraints('he', 'privacy', 'enterprise');
    expect(plan.domain).toBe('workflow');
    expect(plan.relatedProject).toBe('rightflow');
    expect(plan.decision).toContain(copy.priority);
    expect(plan.nextStep).toContain(copy.scale);
  });

  it('changes playbook when priorities change without inventing user metrics', () => {
    const a = buildChallengePlan('An e-commerce store', 'en', 'speed', 'growth');
    const b = buildChallengePlan('An e-commerce store', 'en', 'privacy', 'enterprise');
    expect(a.title).toBe(b.title);
    expect(a.decision).not.toBe(b.decision);
    expect(a.nextStep).not.toBe(b.nextStep);
    expect(a.stages).toHaveLength(3);
  });
});
