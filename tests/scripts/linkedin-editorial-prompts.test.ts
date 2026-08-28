import { describe, expect, it } from 'vitest';
import {
  buildDraftPrompt,
  buildRewritePrompt,
  buildSkepticalReviewPrompt,
  buildTopicSelectionPrompt,
} from '../../scripts/lib/linkedin-editorial-prompts.mjs';

const authorProfile = {
  role: 'senior full-stack product engineer',
  voiceQualities: ['specific', 'curious', 'slightly informal'],
  recurringLenses: ['product behavior matters as much as technical correctness'],
  allowedObservationOpeners: ['I keep seeing', 'A pattern that is easy to miss'],
};

const context = {
  authorProfile,
  recentPosts: [{ slug: 'recent-post', angle: 'A recent angle' }],
  blogInventory: [{ slug: 'source-post', excerpt: 'A grounded source' }],
  repositoryEvidence: [{ reference: 'abc123', summary: 'Fixed stale dashboard state' }],
  performanceSummary: { source: 'manual-fallback' },
};

const selectedCandidate = {
  title: 'The drawer succeeded but the table disagreed',
  tension: 'The mutation succeeds while another product surface remains stale.',
  opinion: 'A mutation is not finished while another screen can contradict it.',
  concreteSituation: 'Update an order in a drawer, close it, and see the old status in the table.',
};

describe('LinkedIn editorial stage prompts', () => {
  it('keeps topic selection separate and requires four narrow, grounded tensions', () => {
    const prompt = buildTopicSelectionPrompt(context);

    expect(prompt).toContain('Generate exactly four');
    expect(prompt).toContain('specific engineering tension');
    expect(prompt).toContain('repositoryEvidence');
    expect(prompt).toContain('Do not draft the post');
  });

  it('builds a draft prompt around a concrete situation and visible opinion', () => {
    const prompt = buildDraftPrompt({ ...context, selectedCandidate });

    expect(prompt).toContain(selectedCandidate.concreteSituation);
    expect(prompt).toContain(selectedCandidate.opinion);
    expect(prompt).toContain('150-250 words');
    expect(prompt).toContain('Do not invent');
    expect(prompt).toContain('Do not critique the draft yet');
  });

  it('gives the skeptical review a distinct anti-AI editorial job', () => {
    const prompt = buildSkepticalReviewPrompt({
      ...context,
      selectedCandidate,
      draft: 'A draft with a concrete product observation.',
    });

    expect(prompt).toContain('Where does this sound AI-generated?');
    expect(prompt).toContain('Could almost any competent AI have written it?');
    expect(prompt).toContain('Do not rewrite the post');
    expect(prompt).toContain('sourceIntegrity');
  });

  it('builds a rewrite prompt from explicit criticism without permitting new anecdotes', () => {
    const prompt = buildRewritePrompt({
      ...context,
      selectedCandidate,
      draft: 'An over-explained draft.',
      critique: { requiredChanges: ['Cut the generic ending.'] },
    });

    expect(prompt).toContain('Cut the generic ending.');
    expect(prompt).toContain('remove 15-25%');
    expect(prompt).toContain('Do not add any personal story');
    expect(prompt).toContain('Return only the rewritten post');
  });

  it('supports compact context references and safe placeholder defaults', () => {
    const compact = { authorProfile, contextReferenceOnly: true };

    expect(buildTopicSelectionPrompt(compact)).toContain('packet.context.recentPosts');
    expect(buildDraftPrompt(compact)).toContain('use the grounded concrete situation');
    expect(buildSkepticalReviewPrompt(compact)).toContain('packet.context.repositoryEvidence');
    expect(buildRewritePrompt()).toContain('ORIGINAL DRAFT');
  });
});
