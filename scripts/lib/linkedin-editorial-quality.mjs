export const EDITORIAL_REVIEW_SCORE_KEYS = [
  'centralIdea',
  'concreteSituation',
  'authorPerspective',
  'humanVoice',
  'technicalCredibility',
  'productSpecificity',
  'naturalRhythm',
  'usefulEnding',
  'responsePotential',
  'beyondDocumentation',
  'technicalRestraint',
  'sourceIntegrity',
];

export const EDITORIAL_RISK_KEYS = [
  'genericAphorisms',
  'linkedinTemplate',
  'preachyTone',
  'genericCallToAction',
  'excessiveLists',
  'fabricatedExperience',
  'vagueAdvice',
  'textbookSummary',
];

export const REQUIRED_EDITORIAL_STAGES = [
  'topic-selection',
  'context-grounding',
  'draft',
  'skeptical-review',
  'final-review',
  'final-validation',
];

const CRITICAL_HUMAN_SCORE_KEYS = [
  'concreteSituation',
  'authorPerspective',
  'humanVoice',
  'beyondDocumentation',
];

const GENERIC_LINKEDIN_PATTERNS = [
  /\bbefore your next\b/iu,
  /\bthe real question is\b/iu,
  /\bthis is why\b/iu,
  /\bevery engineer should\b/iu,
  /\bthe lesson(?:\?|:)?/iu,
  /\bthe takeaway(?:\?|:)?/iu,
  /\bhere(?:'|’)s the thing\b/iu,
  /(?:^|\n)\s*agree\?\s*$/imu,
  /(?:^|\n)\s*thoughts\?\s*$/imu,
  /\bwho else has experienced this\b/iu,
  /\bshare your thoughts\b/iu,
  /\bwhat do you think\??\s*$/iu,
];

const HYPE_PATTERNS = [
  /\bgame[ -]?changer\b/iu,
  /\b10x\b/iu,
  /\bparadigm shift\b/iu,
  /\bthought leadership\b/iu,
  /\brevolutionary\b/iu,
  /\bcutting-edge\b/iu,
];

const SPECIFIC_PERSONAL_CLAIM_PATTERNS = [
  /\b(?:last week|last month|yesterday|recently)\b[^.!?]*(?:\bI\b|\bwe\b|\bmy\b|\bour\b)/iu,
  /\b(?:I|we)\s+(?:built|fixed|shipped|launched|implemented|debugged|migrated|deployed|rewrote|spent)\b/iu,
  /\b(?:my|our)\s+(?:client|company|team|customer|project)\b/iu,
  /\bfor\s+(?:a|my|our)\s+client\b/iu,
];

const STOP_WORDS = new Set([
  'about',
  'after',
  'again',
  'against',
  'also',
  'and',
  'are',
  'because',
  'been',
  'before',
  'being',
  'between',
  'both',
  'but',
  'can',
  'could',
  'does',
  'each',
  'for',
  'from',
  'had',
  'has',
  'have',
  'into',
  'its',
  'just',
  'more',
  'most',
  'not',
  'only',
  'other',
  'our',
  'out',
  'should',
  'some',
  'than',
  'that',
  'the',
  'their',
  'then',
  'there',
  'these',
  'they',
  'this',
  'through',
  'under',
  'very',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'with',
  'would',
  'you',
  'your',
]);

function countWords(text) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function contentTokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/https?:\/\/\S+/gu, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .split(/\s+/u)
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenJaccard(left, right) {
  const leftSet = new Set(Array.isArray(left) ? left : contentTokens(left));
  const rightSet = new Set(Array.isArray(right) ? right : contentTokens(right));

  if (leftSet.size === 0 || rightSet.size === 0) return 0;

  let intersection = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }

  return intersection / (leftSet.size + rightSet.size - intersection);
}

function signatureText(signature) {
  if (!signature || typeof signature !== 'object') return '';

  return [
    signature.thesis,
    ...(Array.isArray(signature.concepts) ? signature.concepts : []),
    signature.mechanism,
    signature.consequence,
    signature.hookPattern,
  ]
    .filter(Boolean)
    .join(' ');
}

export function compareSemanticSignatures(left, right) {
  return tokenJaccard(signatureText(left), signatureText(right));
}

function meaningfulParagraphs(text) {
  return text
    .split(/\n\s*\n/gu)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .filter(paragraph => !paragraph.split(/\n/gu).every(line => /^\s*#/u.test(line)))
    .filter(paragraph => contentTokens(paragraph).length > 0);
}

export function buildEditorialFingerprint(text, structurePattern = 'unspecified') {
  const paragraphs = meaningfulParagraphs(text);
  const openingParagraph = paragraphs[0] || '';
  const openingSentence = openingParagraph.split(/(?<=[.!?])\s+/u)[0] || openingParagraph;
  const ending = paragraphs.at(-1) || '';

  return {
    opening: contentTokens(openingSentence).slice(0, 18).join(' '),
    ending: contentTokens(ending).slice(-24).join(' '),
    structurePattern: String(structurePattern || 'unspecified'),
  };
}

function countListBlocks(text) {
  const lines = text.split(/\r?\n/gu);
  let blocks = 0;
  let insideList = false;

  for (const line of lines) {
    const isListLine = /^\s*(?:[-*]|\d+[.)])\s+/u.test(line);
    if (isListLine && !insideList) blocks += 1;
    insideList = isListLine;
  }

  return blocks;
}

function findUngroundedPersonalClaims(text, grounding) {
  const sentences = text
    .split(/(?<=[.!?])(?:\s+|\n+)/u)
    .map(sentence => sentence.trim())
    .filter(Boolean);
  const verifiedClaims = Array.isArray(grounding?.verifiedPersonalClaims)
    ? grounding.verifiedPersonalClaims
    : [];
  const sources = Array.isArray(grounding?.sources) ? grounding.sources : [];

  return sentences.filter(sentence => {
    if (!SPECIFIC_PERSONAL_CLAIM_PATTERNS.some(pattern => pattern.test(sentence))) return false;

    return !verifiedClaims.some(claim => {
      const claimText = typeof claim?.text === 'string' ? claim.text.trim() : '';
      const sourceReference =
        typeof claim?.sourceReference === 'string' ? claim.sourceReference.trim() : '';
      const sourceExists = sources.some(source => source?.reference === sourceReference);

      return claimText && sentence.includes(claimText) && sourceReference && sourceExists;
    });
  });
}

function validateGrounding(grounding, errors) {
  const allowedModes = new Set([
    'general-observation',
    'published-source',
    'repository-evidence',
    'verified-experience',
  ]);

  if (!grounding || typeof grounding !== 'object') {
    errors.push('editorial grounding is required');
    return;
  }

  if (!allowedModes.has(grounding.mode)) {
    errors.push('editorial grounding mode is invalid');
  }
  if (
    typeof grounding.concreteSituation !== 'string' ||
    grounding.concreteSituation.trim().length < 30
  ) {
    errors.push('grounding must include a concrete product or engineering situation');
  }
  if (!Array.isArray(grounding.sources)) {
    errors.push('grounding sources must be an array');
  } else if (
    ['published-source', 'repository-evidence', 'verified-experience'].includes(grounding.mode) &&
    grounding.sources.length === 0
  ) {
    errors.push(`${grounding.mode} grounding requires at least one source`);
  }
  if (Array.isArray(grounding.sources)) {
    grounding.sources.forEach((source, index) => {
      if (
        typeof source?.type !== 'string' ||
        !source.type.trim() ||
        typeof source?.reference !== 'string' ||
        !source.reference.trim()
      ) {
        errors.push(`grounding source ${index + 1} requires type and reference`);
      }
    });
  }
  if (!Array.isArray(grounding.verifiedPersonalClaims)) {
    errors.push('verifiedPersonalClaims must be an array');
  } else {
    grounding.verifiedPersonalClaims.forEach((claim, index) => {
      if (
        typeof claim?.text !== 'string' ||
        !claim.text.trim() ||
        typeof claim?.sourceReference !== 'string' ||
        !claim.sourceReference.trim()
      ) {
        errors.push(`verified personal claim ${index + 1} requires text and sourceReference`);
      }
    });
  }
}

function validateReview(editorialReview, errors) {
  if (!editorialReview || typeof editorialReview !== 'object') {
    errors.push('editorial review is required');
    return 0;
  }

  if (editorialReview.status !== 'passed') errors.push('editorial review status must be passed');

  const scores = editorialReview.scores;
  let total = 0;
  if (!scores || typeof scores !== 'object') {
    errors.push('editorial review scores are required');
  } else {
    for (const key of EDITORIAL_REVIEW_SCORE_KEYS) {
      const value = scores[key];
      if (!Number.isInteger(value) || value < 3 || value > 5) {
        errors.push(`editorial review score ${key} must be an integer from 3 to 5`);
      }
      total += Number(value || 0);
    }

    for (const key of CRITICAL_HUMAN_SCORE_KEYS) {
      if (Number(scores[key] || 0) < 4) {
        errors.push(`editorial review score ${key} must be at least 4`);
      }
    }
  }

  if (total < 48) errors.push('editorial review total must be at least 48/60');

  const risks = editorialReview.risks;
  if (!risks || typeof risks !== 'object') {
    errors.push('editorial review risks are required');
  } else {
    for (const key of EDITORIAL_RISK_KEYS) {
      if (risks[key] !== false) errors.push(`editorial review risk ${key} must be false`);
    }
  }

  const likelihoods = [
    ['aiGenericLikelihood', 'AI-generic'],
    ['documentationLikelihood', 'documentation'],
    ['thoughtLeaderLikelihood', 'thought-leader'],
  ];
  for (const [key, label] of likelihoods) {
    const value = editorialReview[key];
    if (!Number.isInteger(value) || value < 0 || value > 5) {
      errors.push(`editorial review ${key} must be an integer from 0 to 5`);
    } else if (value > 1) {
      errors.push(`${label} likelihood must be 1 or lower`);
    }
  }
  if (!Array.isArray(editorialReview.unsupportedClaims)) {
    errors.push('editorial review unsupportedClaims must be an array');
  } else if (editorialReview.unsupportedClaims.length > 0) {
    errors.push('editorial review found unsupported claims');
  }
  if (!Array.isArray(editorialReview.requiredChanges)) {
    errors.push('editorial review requiredChanges must be an array');
  } else if (editorialReview.requiredChanges.length > 0) {
    errors.push('editorial review still requires changes');
  }
  if (typeof editorialReview.critique !== 'string' || !editorialReview.critique.trim()) {
    errors.push('editorial review critique is required');
  }

  return total;
}

function validateProcess(editorialProcess, editorialReview, errors) {
  if (!editorialProcess || typeof editorialProcess !== 'object') {
    errors.push('editorial process metadata is required');
    return;
  }

  if (editorialProcess.version !== 2) errors.push('editorial process version must be 2');
  if (!Array.isArray(editorialProcess.stages)) {
    errors.push('editorial process stages are required');
  } else {
    for (const stage of REQUIRED_EDITORIAL_STAGES) {
      if (!editorialProcess.stages.includes(stage)) {
        errors.push(`editorial process is missing ${stage}`);
      }
    }
    const orderedIndexes = REQUIRED_EDITORIAL_STAGES.map(stage =>
      editorialProcess.stages.indexOf(stage)
    );
    if (
      orderedIndexes.every(index => index >= 0) &&
      orderedIndexes.some(
        (index, position) => position > 0 && index <= orderedIndexes[position - 1]
      )
    ) {
      errors.push('editorial process stages are out of order');
    }
    if (
      Number(editorialProcess.rewriteCount || 0) > 0 &&
      !editorialProcess.stages.includes('rewrite')
    ) {
      errors.push('editorial process is missing rewrite');
    }
    if (Number(editorialProcess.rewriteCount || 0) > 0) {
      const reviewIndex = editorialProcess.stages.indexOf('skeptical-review');
      const rewriteIndex = editorialProcess.stages.indexOf('rewrite');
      const finalReviewIndex = editorialProcess.stages.indexOf('final-review');
      if (
        rewriteIndex >= 0 &&
        reviewIndex >= 0 &&
        finalReviewIndex >= 0 &&
        !(reviewIndex < rewriteIndex && rewriteIndex < finalReviewIndex)
      ) {
        errors.push('editorial rewrite must occur between skeptical review and final review');
      }
    }
  }
  if (!Number.isInteger(editorialProcess.reviewPasses) || editorialProcess.reviewPasses < 1) {
    errors.push('editorial process requires at least one skeptical review pass');
  }
  if (
    !Number.isInteger(editorialProcess.rewriteCount) ||
    editorialProcess.rewriteCount < 0 ||
    editorialProcess.rewriteCount > 3
  ) {
    errors.push('editorial process rewriteCount must be from 0 to 3');
  }
  if (editorialReview && editorialReview.rewriteCount !== editorialProcess.rewriteCount) {
    errors.push('editorial review and process rewrite counts must match');
  }
  if (
    Number.isInteger(editorialProcess.reviewPasses) &&
    Number.isInteger(editorialProcess.rewriteCount) &&
    editorialProcess.reviewPasses < editorialProcess.rewriteCount + 1
  ) {
    errors.push('each rewrite requires a new skeptical review pass');
  }
  if (
    typeof editorialProcess.structurePattern !== 'string' ||
    !editorialProcess.structurePattern.trim()
  ) {
    errors.push('editorial process structurePattern is required');
  }
}

function compareAgainstHistory({ fingerprint, semanticSignature, recentPosts, errors, warnings }) {
  const recent = Array.isArray(recentPosts) ? recentPosts.slice(-6) : [];
  let closestSimilarity = { slug: '', score: 0 };

  for (const post of recent) {
    if (post?.editorialFingerprint?.opening && fingerprint.opening) {
      const score = tokenJaccard(fingerprint.opening, post.editorialFingerprint.opening);
      if (score >= 0.72) errors.push(`opening is too similar to recent post ${post.slug}`);
      else if (score >= 0.5) warnings.push(`opening moderately resembles recent post ${post.slug}`);
    }
    if (post?.editorialFingerprint?.ending && fingerprint.ending) {
      const score = tokenJaccard(fingerprint.ending, post.editorialFingerprint.ending);
      if (score >= 0.72) errors.push(`ending is too similar to recent post ${post.slug}`);
      else if (score >= 0.5) warnings.push(`ending moderately resembles recent post ${post.slug}`);
    }
    if (post?.semanticSignature && semanticSignature) {
      const score = compareSemanticSignatures(semanticSignature, post.semanticSignature);
      if (score > closestSimilarity.score) closestSimilarity = { slug: post.slug || '', score };
      if (score >= 0.34) {
        errors.push(
          `semantic similarity to recent post ${post.slug} is too high (${score.toFixed(3)})`
        );
      } else if (score >= 0.2) {
        warnings.push(
          `semantic similarity to recent post ${post.slug} is moderate (${score.toFixed(3)})`
        );
      }
    }
  }

  const consecutiveStructures = [...recent]
    .reverse()
    .findIndex(
      post => post?.editorialFingerprint?.structurePattern !== fingerprint.structurePattern
    );
  const matchingTail = consecutiveStructures === -1 ? recent.length : consecutiveStructures;
  if (recent.length >= 2 && matchingTail >= 2) {
    errors.push(
      `structure pattern ${fingerprint.structurePattern} was already used twice consecutively`
    );
  }

  return closestSimilarity;
}

/**
 * @param {{
 *   text?: string,
 *   grounding?: Record<string, unknown>,
 *   editorialReview?: Record<string, unknown>,
 *   editorialProcess?: Record<string, unknown>,
 *   semanticSignature?: Record<string, unknown>,
 *   recentPosts?: Array<Record<string, unknown>>
 * }} [input]
 */
export function analyzeLinkedInEditorialQuality({
  text = '',
  grounding,
  editorialReview,
  editorialProcess,
  semanticSignature,
  recentPosts = [],
} = {}) {
  const errors = [];
  const warnings = [];
  const bulletLines = text.split(/\r?\n/gu).filter(line => /^\s*(?:[-*]|\d+[.)])\s+/u.test(line));
  const listBlocks = countListBlocks(text);
  const paragraphs = meaningfulParagraphs(text);
  const shortAphorismParagraphs = paragraphs.filter(paragraph => {
    if (/^\s*(?:[-*]|\d+[.)])\s+/u.test(paragraph)) return false;
    return countWords(paragraph) <= 12 && !/[?:]$/u.test(paragraph);
  });
  const rhetoricalQuestions = (text.match(/\?/gu) || []).length;

  if (text.includes('—')) errors.push('post text must not contain em dashes');
  if (bulletLines.length > 5 || listBlocks > 1) errors.push('post text contains an excessive list');
  if (shortAphorismParagraphs.length >= 4) {
    errors.push('post text contains too many slogan-like short paragraphs');
  }
  if (rhetoricalQuestions > 2) errors.push('post text contains too many rhetorical questions');

  for (const pattern of GENERIC_LINKEDIN_PATTERNS) {
    const match = text.match(pattern);
    if (match) errors.push(`post text contains generic LinkedIn phrase: ${match[0].trim()}`);
  }
  for (const pattern of HYPE_PATTERNS) {
    const match = text.match(pattern);
    if (match) errors.push(`post text contains banned hype language: ${match[0]}`);
  }

  validateGrounding(grounding, errors);
  const ungroundedClaims = findUngroundedPersonalClaims(text, grounding);
  for (const claim of ungroundedClaims) {
    errors.push(`personal experience claim is not grounded: ${claim}`);
  }

  const editorialReviewTotal = validateReview(editorialReview, errors);
  validateProcess(editorialProcess, editorialReview, errors);

  const fingerprint = buildEditorialFingerprint(text, editorialProcess?.structurePattern);
  const closestSimilarity = compareAgainstHistory({
    fingerprint,
    semanticSignature,
    recentPosts,
    errors,
    warnings,
  });

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    editorialReviewTotal,
    closestSimilarity,
    fingerprint,
    metrics: {
      wordCount: countWords(text),
      paragraphCount: paragraphs.length,
      bulletLines: bulletLines.length,
      listBlocks,
      shortAphorismParagraphs: shortAphorismParagraphs.length,
      rhetoricalQuestions,
    },
  };
}
