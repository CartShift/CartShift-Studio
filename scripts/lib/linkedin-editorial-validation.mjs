import { analyzeLinkedInEditorialQuality } from './linkedin-editorial-quality.mjs';

export const CRITIC_SCORE_KEYS = [
  'humanVoice',
  'originality',
  'technicalCredibility',
  'professionalPositioning',
  'practicalUsefulness',
  'hookQuality',
];

const LINKEDIN_WORD_COUNT_MIN = 120;
const LINKEDIN_WORD_COUNT_MAX = 320;
const LINKEDIN_HASHTAG_MAX = 2;
const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(https?:\/\/[^)]+\)/i;
const HASHTAG_PATTERN = /(^|\s)#[\p{L}\p{N}_]+/gu;

function countOccurrences(text, value) {
  if (!value) return 0;

  return text.split(value).length - 1;
}

function countWords(text) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

export function validateLinkedInQueueItem(item, { recentPosts = [] } = {}) {
  const errors = [];
  const contentType = item?.contentType || 'blog';
  const criticScores = item?.critic?.scores;
  const signature = item?.semanticSignature;

  if (item?.editorialVersion !== 2) errors.push('editorialVersion must be 2');
  if (!item?.slug) errors.push('slug is required');
  if (!item?.title) errors.push('title is required');
  if (!item?.text) errors.push('text is required');
  if (!['blog', 'original'].includes(contentType)) {
    errors.push('contentType must be blog or original');
  }
  if (contentType === 'blog' && !item?.url) {
    errors.push('blog posts require a URL');
  } else if (contentType === 'blog') {
    const expectedUrl = `https://cart-shift.com/en/blog/${item.slug || ''}`;

    if (item.url !== expectedUrl) errors.push(`url must be the canonical blog URL: ${expectedUrl}`);
    if (countOccurrences(item.text || '', item.url) !== 1) {
      errors.push('post text must include the canonical blog URL exactly once');
    }
  } else if (contentType === 'original' && item?.url) {
    errors.push('original posts must not include a source URL');
  }

  if (item?.text) {
    const wordCount = countWords(item.text);
    const hashtagCount = [...item.text.matchAll(HASHTAG_PATTERN)].length;

    if (wordCount < LINKEDIN_WORD_COUNT_MIN || wordCount > LINKEDIN_WORD_COUNT_MAX) {
      errors.push(
        `post text must contain ${LINKEDIN_WORD_COUNT_MIN}-${LINKEDIN_WORD_COUNT_MAX} words (received ${wordCount})`
      );
    }
    if (hashtagCount > LINKEDIN_HASHTAG_MAX) {
      errors.push(`post text must contain no more than ${LINKEDIN_HASHTAG_MAX} hashtags`);
    }
    if (MARKDOWN_LINK_PATTERN.test(item.text)) {
      errors.push('post text must be plain text and cannot contain Markdown links');
    }
    if (/\\[nr]/u.test(item.text)) {
      errors.push('post text contains escaped newline characters instead of real line breaks');
    }
  }

  if (item?.critic?.status !== 'passed') errors.push('critic status must be passed');
  if (!criticScores) {
    errors.push('critic scores are required');
  } else {
    for (const key of CRITIC_SCORE_KEYS) {
      if (!Number.isInteger(criticScores[key]) || criticScores[key] < 3 || criticScores[key] > 5) {
        errors.push(`critic score ${key} must be an integer from 3 to 5`);
      }
    }
    const total = CRITIC_SCORE_KEYS.reduce((sum, key) => sum + Number(criticScores[key] || 0), 0);
    if (total < 25) errors.push('critic score total must be at least 25');
  }
  if (!Array.isArray(item?.critic?.unsupportedClaims)) {
    errors.push('critic unsupportedClaims must be an array');
  } else if (item.critic.unsupportedClaims.length > 0) {
    errors.push('critic found unsupported claims');
  }

  if (typeof signature?.thesis !== 'string' || !signature.thesis.trim()) {
    errors.push('semantic thesis is required');
  }
  if (!Array.isArray(signature?.concepts) || signature.concepts.length < 2) {
    errors.push('at least two semantic concepts are required');
  }
  if (typeof signature?.mechanism !== 'string' || !signature.mechanism.trim()) {
    errors.push('semantic mechanism is required');
  }
  if (typeof signature?.consequence !== 'string' || !signature.consequence.trim()) {
    errors.push('semantic consequence is required');
  }
  if (typeof signature?.hookPattern !== 'string' || !signature.hookPattern.trim()) {
    errors.push('semantic hookPattern is required');
  }

  const editorialQuality = analyzeLinkedInEditorialQuality({
    text: item?.text || '',
    grounding: item?.grounding,
    editorialReview: item?.editorialReview,
    editorialProcess: item?.editorialProcess,
    semanticSignature: signature,
    recentPosts,
  });
  errors.push(...editorialQuality.errors);

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: editorialQuality.warnings,
    editorialReviewTotal: editorialQuality.editorialReviewTotal,
    closestSimilarity: editorialQuality.closestSimilarity,
    editorialFingerprint: editorialQuality.fingerprint,
    metrics: editorialQuality.metrics,
    criticTotal: criticScores
      ? CRITIC_SCORE_KEYS.reduce((sum, key) => sum + Number(criticScores[key] || 0), 0)
      : 0,
  };
}
