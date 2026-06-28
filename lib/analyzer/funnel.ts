import type { AnalysisResult, Recommendation } from '@/lib/types/analyzer';

export const ANALYZER_INTENTS = ['conversion', 'speed', 'seo', 'trust', 'checkout'] as const;
export type AnalyzerIntent = (typeof ANALYZER_INTENTS)[number];

export const PRIMARY_ISSUES = [
  'speed',
  'seo',
  'trust',
  'product_page',
  'checkout',
  'general_conversion',
] as const;
export type PrimaryIssue = (typeof PRIMARY_ISSUES)[number];

export type AttributionTouch = {
  landingPath: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referralCode?: string;
  partnerCode?: string;
  intent?: AnalyzerIntent;
  capturedAt: string;
};

export type AnalyzerAttribution = {
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
};

export type PrimaryIssueDecision = {
  primaryIssue: PrimaryIssue;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  scores: Record<PrimaryIssue, number>;
};

const CODE_PATTERNS: Record<Exclude<PrimaryIssue, 'general_conversion'>, RegExp> = {
  speed: /(lcp|blocking|layout_shift|server_response|script_count|lazy_loading|performance|image)/i,
  seo: /(title|meta|canonical|schema|structured_data|index|crawl|h1|social_metadata|content_clarity)/i,
  trust: /(review|privacy|policy|trust|guarantee|contact|payment_cues|secure)/i,
  product_page: /(product|buy_button|add_to_cart|description|variant|price|delivery|return)/i,
  checkout: /(checkout|cart|payment|shipping)/i,
};

function recommendationSignal(recommendations: Recommendation[], pattern: RegExp): number {
  return recommendations.reduce((score, recommendation) => {
    const text = [recommendation.code, recommendation.title, recommendation.description]
      .filter(Boolean)
      .join(' ');
    if (!pattern.test(text)) return score;
    return (
      score + (recommendation.impact === 'high' ? 18 : recommendation.impact === 'medium' ? 10 : 4)
    );
  }, 0);
}

/** Deterministic prioritization: measured section deficits first, then finding-specific evidence. */
export function determinePrimaryIssue(result: AnalysisResult): PrimaryIssueDecision {
  const allRecommendations = Object.values(result.sections).flatMap(
    section => section.recommendations
  );
  const scores: Record<PrimaryIssue, number> = {
    speed: Math.max(0, 100 - result.sections.performance.score),
    seo: Math.max(0, 100 - result.sections.seo.score),
    trust: Math.max(0, 100 - result.sections.trust.score),
    product_page: result.productAnalysis ? Math.max(0, 100 - result.productAnalysis.score) : 0,
    checkout: Math.max(0, 100 - result.sections.cart.score),
    general_conversion: Math.max(10, 100 - result.overallScore),
  };

  for (const issue of ['speed', 'seo', 'trust', 'product_page', 'checkout'] as const) {
    scores[issue] += recommendationSignal(allRecommendations, CODE_PATTERNS[issue]);
  }

  if (result.coreWebVitals?.lcp?.rating === 'poor') scores.speed += 30;
  if (result.deeperScan?.cartInteraction?.attempted) {
    const cart = result.deeperScan.cartInteraction;
    if (!cart.addToCartClicked || !cart.checkoutLinkDetected) scores.checkout += 28;
  }
  if (result.productAnalysis) {
    if (!result.productAnalysis.hasBuyButtonAboveFold) scores.product_page += 20;
    if (!result.productAnalysis.hasReviews) scores.trust += 12;
    if (result.productAnalysis.descriptionLength < 180) scores.product_page += 12;
  }

  const ranked = (Object.entries(scores) as Array<[PrimaryIssue, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  const [winner, runnerUp] = ranked;
  const primaryIssue =
    winner[1] < 28 || winner[1] - runnerUp[1] < 6 ? 'general_conversion' : winner[0];
  const winningScore = scores[primaryIssue];
  return {
    primaryIssue,
    confidence: winningScore >= 75 ? 'high' : winningScore >= 45 ? 'medium' : 'low',
    reasons:
      primaryIssue === 'general_conversion'
        ? ['No single issue category materially outweighed the others.']
        : [
            `${primaryIssue} received the highest evidence-weighted opportunity score (${Math.round(winningScore)}).`,
          ],
    scores,
  };
}

export function isAnalyzerIntent(value: unknown): value is AnalyzerIntent {
  return typeof value === 'string' && ANALYZER_INTENTS.includes(value as AnalyzerIntent);
}

export function mapArticleToAnalyzerIntent(input: {
  analyzerIntent?: string;
  category?: string;
  tags?: string[];
  title?: string;
}): AnalyzerIntent {
  if (isAnalyzerIntent(input.analyzerIntent)) return input.analyzerIntent;
  const haystack = [input.category, input.title, ...(input.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/(speed|performance|core web vital|loading|mobile)/.test(haystack)) return 'speed';
  if (/(seo|search|schema|content|organic)/.test(haystack)) return 'seo';
  if (/(trust|review|policy|social proof|security)/.test(haystack)) return 'trust';
  if (/(checkout|cart|payment|shipping)/.test(haystack)) return 'checkout';
  return 'conversion';
}

export function canPublishAuditInsight(review: {
  reviewVisibility?: string;
  anonymousInsightConsent?: boolean;
  namedStoreConsent?: boolean;
}) {
  if (!review.anonymousInsightConsent) return false;
  if (review.reviewVisibility === 'anonymous_educational') return true;
  return (
    review.reviewVisibility === 'approved_public_case_study' && review.namedStoreConsent === true
  );
}
