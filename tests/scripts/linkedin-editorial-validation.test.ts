import { describe, expect, it } from 'vitest';
import { validateLinkedInQueueItem } from '../../scripts/lib/linkedin-editorial-validation.mjs';

const slug = 'reliable-product-systems';
const url = `https://cart-shift.com/en/blog/${slug}`;

function createText({ hashtags = '#ProductEngineering', link = url, words = 230 } = {}) {
  const body = Array.from({ length: words }, (_, index) => `detail${index + 1}`).join(' ');

  return `A useful product detail starts with the friction it removes.\n\n${body}\n\nFull breakdown: ${link}\n\n${hashtags}`;
}

function createOriginalText({ hashtags = '#ProductEngineering', words = 230 } = {}) {
  const body = Array.from({ length: words }, (_, index) => `detail${index + 1}`).join(' ');

  return `A useful product observation starts with the friction it reveals.\n\n${body}\n\n${hashtags}`;
}

function createItem(overrides = {}) {
  return {
    contentType: 'blog',
    slug,
    title: 'Reliable Product Systems',
    url,
    text: createText(),
    semanticSignature: {
      thesis: 'Reliable systems make the next action clear.',
      concepts: ['product engineering', 'operational clarity'],
      mechanism: 'Boundaries and explicit states reduce ambiguity.',
      consequence: 'Operators can understand and trust the workflow.',
      hookPattern: 'builder-observation',
    },
    critic: {
      status: 'passed',
      scores: {
        humanVoice: 4,
        originality: 4,
        technicalCredibility: 5,
        professionalPositioning: 4,
        practicalUsefulness: 4,
        hookQuality: 4,
      },
      unsupportedClaims: [],
      total: 25,
      rewriteCount: 0,
    },
    ...overrides,
  };
}

describe('validateLinkedInQueueItem', () => {
  it('accepts a clean, source-grounded blog post', () => {
    expect(validateLinkedInQueueItem(createItem())).toMatchObject({ valid: true, errors: [] });
  });

  it('accepts a clean original professional post without a source URL', () => {
    const result = validateLinkedInQueueItem(
      createItem({ contentType: 'original', url: '', text: createOriginalText() })
    );

    expect(result).toMatchObject({ valid: true, errors: [] });
  });

  it('rejects source URLs on original posts', () => {
    const result = validateLinkedInQueueItem(
      createItem({ contentType: 'original', text: createOriginalText() })
    );

    expect(result.errors).toContain('original posts must not include a source URL');
  });

  it('requires the canonical source URL exactly once', () => {
    const result = validateLinkedInQueueItem(
      createItem({ text: `${createText()}\n\nFull breakdown: ${url}` })
    );

    expect(result.errors).toContain('post text must include the canonical blog URL exactly once');
  });

  it('rejects Markdown link artifacts and hashtag stacks', () => {
    const result = validateLinkedInQueueItem(
      createItem({
        text: createText({
          hashtags: '#AI #Engineering #SaaS',
          link: `[Full breakdown](${url})`,
        }),
      })
    );

    expect(result.errors).toContain(
      'post text must be plain text and cannot contain Markdown links'
    );
    expect(result.errors).toContain('post text must contain no more than 2 hashtags');
  });

  it('rejects posts outside the editorial length range', () => {
    const result = validateLinkedInQueueItem(createItem({ text: createText({ words: 50 }) }));

    expect(result.errors).toContainEqual(expect.stringContaining('must contain 220-450 words'));
  });

  it('rejects literal escaped newlines', () => {
    const result = validateLinkedInQueueItem(
      createItem({ text: createText().replaceAll('\n', '\\n') })
    );

    expect(result.errors).toContain(
      'post text contains escaped newline characters instead of real line breaks'
    );
  });
});
