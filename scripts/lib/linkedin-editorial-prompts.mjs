import { EDITORIAL_REVIEW_SCORE_KEYS, EDITORIAL_RISK_KEYS } from './linkedin-editorial-quality.mjs';

function json(value) {
  return JSON.stringify(value ?? null, null, 2);
}

function sharedVoiceContract(authorProfile) {
  return `AUTHOR PROFILE
${json(authorProfile)}

VOICE CONTRACT
- Sound like a senior full-stack product engineer reflecting on something noticed while building products.
- Let technical knowledge emerge from an observation, product behavior, tradeoff, or implementation decision.
- Keep one central idea. Prefer one memorable insight over a catalogue of correct principles.
- Make the opinion visible and nuanced. Curiosity is better than certainty; specificity is better than authority.
- Use natural paragraph and sentence variation. Do not write a sequence of polished aphorisms.
- Never sound corporate, motivational, inspirational, preachy, or like generic LinkedIn thought leadership.
- Do not use em dashes, hype language, fake quotations, manufactured controversy, or engagement bait.
- Do not use formulaic phrases such as "Before your next", "The real question is", "The lesson?", "The takeaway?", "Agree?", or "Thoughts?".
- First-person preferences and general observations are welcome. Do not invent a client, company, team, date, incident, result, metric, or personal project history.`;
}

function compactContext(context) {
  if (context.contextReferenceOnly) {
    return {
      reference:
        'Use packet.context.recentPosts, blogInventory, repositoryEvidence, and performanceSummary from the same context packet.',
    };
  }

  return {
    recentPosts: context.recentPosts || [],
    blogInventory: context.blogInventory || [],
    repositoryEvidence: context.repositoryEvidence || [],
    performanceSummary: context.performanceSummary || {},
  };
}

export function buildTopicSelectionPrompt(context = {}) {
  return `You are the topic editor for Yotam's personal LinkedIn feed. Your only job in this pass is to select a narrow reason for a post to exist.

${sharedVoiceContract(context.authorProfile)}

CURRENT EDITORIAL CONTEXT
${json(compactContext(context))}

Generate exactly four distinct candidates, balancing blog-derived and original perspectives when cadence rules permit.

Each candidate must begin with a specific engineering tension, failure mode, surprising product behavior, decision, or defensible tradeoff. Reject broad subjects such as clean code, scalability, testing matters, technical debt is bad, generic API design, or optimistic UI without a narrower observation.

For every candidate provide:
- contentType, source references, title, topicKey, editorialPillar, audience, and format
- the observation or tension
- one concrete product or engineering situation
- Yotam's defensible opinion
- the technical mechanism that makes the situation interesting
- the unresolved tradeoff or practical test
- a semantic signature
- the configured 0-5 editorial scores and repetition penalties
- closest semantic similarity to recent confirmed posts
- eligibility and a concise reason

Repository evidence may support what was built or changed, but never infer outcomes, client details, or personal experiences that the evidence does not prove. A blog source may support technical claims, not a claim that Yotam personally encountered the situation.

Return structured JSON only. Do not draft the post in this pass.`;
}

export function buildDraftPrompt(context = {}) {
  return `You are the writer for Yotam's personal LinkedIn feed. Draft one post from the already selected editorial candidate.

${sharedVoiceContract(context.authorProfile)}

SELECTED CANDIDATE
${json(context.selectedCandidate)}

GROUNDING CONTEXT
${json(
  context.contextReferenceOnly
    ? {
        reference:
          'Use packet.context.repositoryEvidence, blogInventory, and recentPosts from the same context packet.',
      }
    : {
        repositoryEvidence: context.repositoryEvidence || [],
        blogInventory: context.blogInventory || [],
        recentPosts: context.recentPosts || [],
      }
)}

WRITING JOB
- Start from the selected concrete situation: ${context.selectedCandidate?.concreteSituation || 'use the grounded concrete situation'}
- Make this opinion visible: ${context.selectedCandidate?.opinion || 'state a defensible, nuanced engineering opinion'}
- Explain why the obvious implementation is insufficient, then introduce only the technical detail needed to support the opinion.
- Target 150-250 words. Use 120-320 only when the idea genuinely needs it.
- Use zero or one short list only when a list clarifies the situation. Use 0-2 specific hashtags, and omit them when they add nothing.
- End with a concrete test, a nuanced tradeoff, an observation, or one technically answerable question. Do not force a CTA.
- Vary the structure from recent posts. Do not default to statement, explanation, list, importance, generic advice.
- Do not invent any personal experience. Use first-person only for supported experience, a general observation, or an honest preference such as "I prefer" or "I do not like".
- For blog-derived posts, include the canonical URL exactly once. Original posts normally contain no URL.

Return only the plain-text draft. Do not critique the draft yet.`;
}

export function buildSkepticalReviewPrompt(context = {}) {
  return `You are a skeptical senior engineer and editor. Review the draft as if you are tired of polished AI-written LinkedIn posts. Do not reward correctness alone.

${sharedVoiceContract(context.authorProfile)}

SELECTED CANDIDATE
${json(context.selectedCandidate)}

GROUNDING CONTEXT
${json(
  context.contextReferenceOnly
    ? {
        reference:
          'Use packet.context.repositoryEvidence and blogInventory from the same context packet.',
      }
    : {
        repositoryEvidence: context.repositoryEvidence || [],
        blogInventory: context.blogInventory || [],
      }
)}

DRAFT
${context.draft || ''}

Interrogate the draft:
- Where does this sound AI-generated?
- Which lines sound like generic LinkedIn writing or polished aphorisms?
- What is too abstract, obvious, preachy, or documentation-like?
- Is the concrete situation doing real explanatory work?
- Is the author's opinion actually visible and defensible?
- Does the technical depth serve one argument, or does it become a mini-textbook?
- Could almost any competent AI have written it?
- Does it add something beyond information easy to find in documentation?
- Can it remove 15-25% while becoming more specific?
- Is the ending predictable, generic, or forced?
- Is the opening earned by the rest of the post?
- Does any personal claim lack explicit support?

Score these keys from 0-5: ${EDITORIAL_REVIEW_SCORE_KEYS.join(', ')}.
Set every risk explicitly to true or false: ${EDITORIAL_RISK_KEYS.join(', ')}.
Also return aiGenericLikelihood, documentationLikelihood, and thoughtLeaderLikelihood from 0-5; unsupportedClaims; concise critique; requiredChanges; and status.

Passing requires every score at least 3; concreteSituation, authorPerspective, humanVoice, and beyondDocumentation at least 4; total at least 48/60; all risks false; all three likelihoods at most 1; no unsupported claims; and no required changes.

Return structured JSON only. Do not rewrite the post in this pass.`;
}

export function buildRewritePrompt(context = {}) {
  return `You are revising a LinkedIn draft after a skeptical senior-engineer review.

${sharedVoiceContract(context.authorProfile)}

SELECTED CANDIDATE
${json(context.selectedCandidate)}

ORIGINAL DRAFT
${context.draft || ''}

EDITORIAL CRITIQUE
${json(context.critique)}

Rewrite the post to address every required change. Prefer to remove 15-25% rather than add more explanation. Make the concrete product behavior and author opinion carry the technical idea. Replace generic conclusions with a concrete test, nuanced observation, unresolved tradeoff, or one technically answerable question.

Do not add any personal story, project, client, company, metric, outcome, or incident that is not present in the grounding context. Do not add a list unless it is necessary. Do not preserve a line merely because it sounds polished.

Return only the rewritten post. It must go through the skeptical review again.`;
}
