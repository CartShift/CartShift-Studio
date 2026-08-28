import { describe, expect, it } from 'vitest';
import {
  analyzeLinkedInEditorialQuality,
  buildEditorialFingerprint,
  compareSemanticSignatures,
} from '../../scripts/lib/linkedin-editorial-quality.mjs';

const baseText = `You update an order from a side drawer, close it, and the table behind it still shows the previous status.

The request succeeded. The drawer even showed a success toast. But the product now has two answers for the same order, and the person using it has no good reason to trust either one.

I like optimistic updates for actions that are easy to reverse. I do not like using them to make an uncertain write look settled. The implementation is not finished when the button owner looks correct. It is finished when the other views that carry the same fact can no longer contradict it.

That usually means deciding which cache gets patched immediately, which queries should be invalidated, and what the interface says if the write fails after the optimistic state appears. The exact choice depends on how expensive a refetch is and how many screens share the entity.

A useful test is to complete the mutation, then open another surface that shows the same record. If the two views tell different stories, there is still product work hiding inside the state-management work.`;

const semanticSignature = {
  thesis: 'A mutation is incomplete while another product surface can contradict its result.',
  concepts: ['server state', 'optimistic updates', 'cache invalidation', 'product consistency'],
  mechanism:
    'Patch or invalidate every relevant cached representation and make rollback behavior visible.',
  consequence: 'People see one coherent account of the entity after a write or failure.',
  hookPattern: 'concrete-product-bug',
};

function createGrounding(overrides = {}) {
  return {
    mode: 'general-observation',
    concreteSituation:
      'An order is updated in a side drawer while the table behind it keeps the old status.',
    sources: [],
    verifiedPersonalClaims: [],
    ...overrides,
  };
}

function createReview(overrides = {}) {
  return {
    status: 'passed',
    scores: {
      centralIdea: 5,
      concreteSituation: 5,
      authorPerspective: 5,
      humanVoice: 5,
      technicalCredibility: 5,
      productSpecificity: 5,
      naturalRhythm: 4,
      usefulEnding: 5,
      responsePotential: 4,
      beyondDocumentation: 5,
      technicalRestraint: 4,
      sourceIntegrity: 5,
    },
    risks: {
      genericAphorisms: false,
      linkedinTemplate: false,
      preachyTone: false,
      genericCallToAction: false,
      excessiveLists: false,
      fabricatedExperience: false,
      vagueAdvice: false,
      textbookSummary: false,
    },
    aiGenericLikelihood: 1,
    documentationLikelihood: 0,
    thoughtLeaderLikelihood: 0,
    unsupportedClaims: [],
    critique: 'The post earns its opinion through a recognizable product behavior.',
    requiredChanges: [],
    rewriteCount: 1,
    ...overrides,
  };
}

function analyze(overrides: Record<string, unknown> = {}) {
  return analyzeLinkedInEditorialQuality({
    text: baseText,
    grounding: createGrounding(),
    editorialReview: createReview(),
    editorialProcess: {
      version: 2,
      stages: [
        'topic-selection',
        'context-grounding',
        'draft',
        'skeptical-review',
        'rewrite',
        'final-review',
        'final-validation',
      ],
      reviewPasses: 2,
      rewriteCount: 1,
      structurePattern: 'concrete-product-bug',
    },
    semanticSignature,
    recentPosts: [],
    ...overrides,
  });
}

describe('LinkedIn editorial quality gate', () => {
  it('accepts a concrete, opinionated, source-safe engineering observation', () => {
    expect(analyze()).toMatchObject({ valid: true, errors: [] });
  });

  it.each([
    'Before your next mutation ships, review every cache.',
    'The real question is whether the state can be trusted.',
    'Agree?',
    'Thoughts?',
  ])('rejects generic LinkedIn CTA language: %s', phrase => {
    const result = analyze({ text: `${baseText}\n\n${phrase}` });

    expect(result.errors).toContainEqual(expect.stringContaining('generic LinkedIn phrase'));
  });

  it('rejects em dashes and excessive list formatting', () => {
    const result = analyze({
      text: `${baseText}\n\nThe cache—despite succeeding—still lies.\n\n- one\n- two\n- three\n- four\n- five\n- six`,
    });

    expect(result.errors).toContain('post text must not contain em dashes');
    expect(result.errors).toContain('post text contains an excessive list');
  });

  it('rejects specific personal experience claims without evidence', () => {
    const text = `Last week I fixed this exact issue for a client.\n\n${baseText}`;
    const result = analyze({ text });

    expect(result.errors).toContainEqual(
      expect.stringContaining('personal experience claim is not grounded')
    );
  });

  it('allows a specific personal claim when the exact claim and source are recorded', () => {
    const claim = 'Last week I fixed this exact issue for a client.';
    const result = analyze({
      text: `${claim}\n\n${baseText}`,
      grounding: createGrounding({
        mode: 'verified-experience',
        sources: [{ type: 'project-record', reference: 'docs/verified-case-note.md' }],
        verifiedPersonalClaims: [{ text: claim, sourceReference: 'docs/verified-case-note.md' }],
      }),
    });

    expect(result.errors).not.toContainEqual(
      expect.stringContaining('personal experience claim is not grounded')
    );
  });

  it('rejects low-scoring or risk-flagged skeptical reviews', () => {
    const editorialReview = createReview({
      scores: { ...createReview().scores, authorPerspective: 2 },
      risks: { ...createReview().risks, textbookSummary: true },
      aiGenericLikelihood: 4,
    });
    const result = analyze({ editorialReview });

    expect(result.errors).toContainEqual(expect.stringContaining('authorPerspective'));
    expect(result.errors).toContainEqual(expect.stringContaining('textbookSummary'));
    expect(result.errors).toContain('AI-generic likelihood must be 1 or lower');
  });

  it('requires explicit likelihood scores and structured grounding sources', () => {
    const { aiGenericLikelihood: _omitted, ...editorialReview } = createReview();
    const result = analyze({
      editorialReview,
      grounding: createGrounding({
        mode: 'repository-evidence',
        sources: [{}],
      }),
    });

    expect(result.errors).toContain(
      'editorial review aiGenericLikelihood must be an integer from 0 to 5'
    );
    expect(result.errors).toContain('grounding source 1 requires type and reference');
  });

  it('rejects missing editorial evidence and process metadata', () => {
    const result = analyze({
      grounding: undefined,
      editorialReview: undefined,
      editorialProcess: undefined,
    });

    expect(result.errors).toContain('editorial grounding is required');
    expect(result.errors).toContain('editorial review is required');
    expect(result.errors).toContain('editorial process metadata is required');
  });

  it('reports malformed grounding, review, and process contracts', () => {
    const result = analyze({
      grounding: {
        mode: 'invented-story',
        concreteSituation: 'Too vague',
        sources: 'not-an-array',
        verifiedPersonalClaims: 'not-an-array',
      },
      editorialReview: {
        status: 'failed',
        scores: {},
        risks: {},
        aiGenericLikelihood: 'high',
        documentationLikelihood: -1,
        thoughtLeaderLikelihood: 6,
        unsupportedClaims: 'not-an-array',
        requiredChanges: 'not-an-array',
        critique: '',
        rewriteCount: 2,
      },
      editorialProcess: {
        version: 1,
        stages: [],
        reviewPasses: 0,
        rewriteCount: 4,
        structurePattern: '',
      },
    });

    expect(result.errors).toContain('editorial grounding mode is invalid');
    expect(result.errors).toContain('editorial review status must be passed');
    expect(result.errors).toContain('editorial process version must be 2');
    expect(result.errors).toContain('editorial process rewriteCount must be from 0 to 3');
  });

  it('rejects slogan stacks, hype language, and question-heavy formatting', () => {
    const text = `${baseText}\n\nFast wins.\n\nScale matters.\n\nTrust matters.\n\nEverything changes.\n\nIs it fast? Is it safe? Is it clear?\n\nThis is a game changer.`;
    const result = analyze({ text });

    expect(result.errors).toContain('post text contains too many slogan-like short paragraphs');
    expect(result.errors).toContain('post text contains too many rhetorical questions');
    expect(result.errors).toContainEqual(expect.stringContaining('banned hype language'));
  });

  it('rejects an out-of-order rewrite and final review process', () => {
    const result = analyze({
      editorialProcess: {
        version: 2,
        stages: [
          'topic-selection',
          'context-grounding',
          'draft',
          'final-review',
          'rewrite',
          'skeptical-review',
          'final-validation',
        ],
        reviewPasses: 2,
        rewriteCount: 1,
        structurePattern: 'concrete-product-bug',
      },
    });

    expect(result.errors).toContain('editorial process stages are out of order');
    expect(result.errors).toContain(
      'editorial rewrite must occur between skeptical review and final review'
    );
  });

  it('rejects repeated openings, endings, and the third consecutive structure pattern', () => {
    const fingerprint = buildEditorialFingerprint(baseText, 'concrete-product-bug');
    const recentPosts = Array.from({ length: 3 }, (_, index) => ({
      slug: `recent-${index}`,
      editorialFingerprint: fingerprint,
    }));
    const result = analyze({ recentPosts });

    expect(result.errors).toContainEqual(expect.stringContaining('opening is too similar'));
    expect(result.errors).toContainEqual(expect.stringContaining('ending is too similar'));
    expect(result.errors).toContainEqual(expect.stringContaining('structure pattern'));
  });

  it('rejects high semantic similarity to a recent confirmed post', () => {
    const result = analyze({
      recentPosts: [{ slug: 'same-idea', semanticSignature }],
    });

    expect(result.errors).toContainEqual(expect.stringContaining('semantic similarity'));
  });
});

describe('compareSemanticSignatures', () => {
  it('returns a bounded content-word Jaccard score', () => {
    const score = compareSemanticSignatures(semanticSignature, {
      ...semanticSignature,
      consequence: 'The interface stays coherent after a mutation.',
    });

    expect(score).toBeGreaterThan(0.5);
    expect(score).toBeLessThanOrEqual(1);
  });
});
