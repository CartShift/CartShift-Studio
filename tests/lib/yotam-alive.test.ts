import { describe, expect, it } from 'vitest';
import {
  aliveDirectiveSchema,
  aliveProjectSlugs,
  guidedPortfolioAnswer,
  portfolioKnowledge,
} from '@/lib/yotam-alive';

describe('YOTAM / ALIVE public knowledge', () => {
  it('only exposes the five canonical public projects', () => {
    const projects = portfolioKnowledge('en');
    expect(projects.map(project => project.slug)).toEqual([...aliveProjectSlugs]);
    expect(projects.every(project => project.summary && project.role && project.highlights.length)).toBe(true);
  });

  it('routes Hebrew questions to a relevant, localized public case', () => {
    const answer = guidedPortfolioAnswer('איך בנית את הסוכן AI והארכיטקטורה?', 'he');
    expect(answer.project).toBe('starlinker');
    expect(answer.view).toBe('architecture');
    expect(answer.answer).toContain('StarLinker');
  });

  it('routes commerce and product operations to CartShift', () => {
    const answer = guidedPortfolioAnswer('Tell me about Shopify and commerce operations', 'en');
    expect(answer.project).toBe('cartshift-studio');
    expect(answer.view).toBe('project');
  });

  it('does not pretend to be live AI when the topic is unknown', () => {
    const answer = guidedPortfolioAnswer('What is the weather tomorrow?', 'en');
    expect(answer.project).toBe('none');
    expect(answer.view).toBe('work');
    expect(answer.answer).toMatch(/guided tour/i);
  });

  it('turns explicit requests into only allowlisted interactive views', () => {
    const demo = guidedPortfolioAnswer('Show me a StarLinker demo', 'en');
    const challenge = guidedPortfolioAnswer('Challenge my product idea', 'en');
    expect(demo.view).toBe('demo');
    expect(demo.project).toBe('starlinker');
    expect(challenge.view).toBe('challenge');
    expect(challenge.project).toBe('none');
  });

  it('rejects navigation outside the project allowlist', () => {
    expect(aliveDirectiveSchema.safeParse({
      answer: 'Open internal portal',
      project: '/portal/dashboard',
      view: 'project',
    }).success).toBe(false);
  });

  it('rejects extra action fields and oversized answers', () => {
    expect(aliveDirectiveSchema.safeParse({
      answer: 'Hello',
      project: 'starlinker',
      view: 'project',
      externalUrl: 'https://attacker.example',
    }).success).toBe(false);
    expect(aliveDirectiveSchema.safeParse({
      answer: 'x'.repeat(1601),
      project: 'none',
      view: 'none',
    }).success).toBe(false);
  });
});
