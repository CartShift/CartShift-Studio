export const CRITIC_SCORE_KEYS = [
  'humanVoice',
  'originality',
  'technicalCredibility',
  'professionalPositioning',
  'practicalUsefulness',
  'hookQuality',
];

export function validateLinkedInQueueItem(item) {
  const errors = [];
  const contentType = item?.contentType || 'blog';
  const criticScores = item?.critic?.scores;
  const signature = item?.semanticSignature;

  if (!item?.slug) errors.push('slug is required');
  if (!item?.title) errors.push('title is required');
  if (!item?.text) errors.push('text is required');
  if (!['blog', 'original'].includes(contentType)) errors.push('contentType must be blog or original');
  if (contentType === 'blog' && !item?.url) errors.push('blog posts require a URL');

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

  return {
    valid: errors.length === 0,
    errors,
    criticTotal: criticScores
      ? CRITIC_SCORE_KEYS.reduce((sum, key) => sum + Number(criticScores[key] || 0), 0)
      : 0,
  };
}
