export const ANALYZER_SECTION_KEYS = {
  performance: 'sections.performance',
  seo: 'sections.seo',
  accessibility: 'sections.accessibility',
  bestPractices: 'sections.bestPractices',
  cart: 'sections.cart',
  trust: 'sections.trust',
} as const;

export type AnalyzerSectionTranslationKey =
  (typeof ANALYZER_SECTION_KEYS)[keyof typeof ANALYZER_SECTION_KEYS];

export const MARKET_POSITION_KEYS = {
  leader: 'market.positions.leader',
  challenger: 'market.positions.challenger',
  niche: 'market.positions.niche',
  unknown: 'market.positions.unknown',
} as const;

export const MARKET_CONFIDENCE_KEYS = {
  high: 'market.confidence.high',
  medium: 'market.confidence.medium',
  low: 'market.confidence.low',
} as const;

export const AI_STATUS_KEYS = {
  ready: 'ai.status.ready',
  needs_improvement: 'ai.status.needs_improvement',
  not_optimized: 'ai.status.not_optimized',
} as const;

export const AI_SCHEMA_STATUS_KEYS = {
  not_scanned: 'ai.schemaStatus.not_scanned',
  not_applicable: 'ai.schemaStatus.not_applicable',
  not_verified: 'ai.schemaStatus.not_verified',
  present: 'ai.schemaStatus.present',
  partial: 'ai.schemaStatus.partial',
  missing: 'ai.schemaStatus.missing',
  invalid: 'ai.schemaStatus.invalid',
} as const;

export const PRODUCT_CART_STATUS_KEYS = {
  detected: 'product.cartStatus.detected',
  clickable: 'product.cartStatus.clickable',
  redirected_to_cart: 'product.cartStatus.redirected_to_cart',
  unknown: 'product.cartStatus.unknown',
} as const;

export const ANALYSIS_CONFIDENCE_KEYS = {
  measured: 'confidence.measured',
  verified: 'confidence.verified',
  estimated: 'confidence.estimated',
  insufficient_evidence: 'confidence.insufficient_evidence',
  unavailable: 'confidence.unavailable',
} as const;

export const IMPACT_KEYS = {
  high: 'impact.high',
  medium: 'impact.medium',
  low: 'impact.low',
} as const;

export const ROADMAP_WEEK_KEYS = {
  week1: { title: 'roadmap.weeks.week1.title', focus: 'roadmap.weeks.week1.focus' },
  week2: { title: 'roadmap.weeks.week2.title', focus: 'roadmap.weeks.week2.focus' },
  week3: { title: 'roadmap.weeks.week3.title', focus: 'roadmap.weeks.week3.focus' },
  week4: { title: 'roadmap.weeks.week4.title', focus: 'roadmap.weeks.week4.focus' },
} as const;

export const RECOMMENDATION_GROUP_KEYS = {
  measuredFindings: {
    title: 'recommendationGroups.measuredFindings.title',
    subtitle: 'recommendationGroups.measuredFindings.subtitle',
  },
  verifiedFixes: {
    title: 'recommendationGroups.verifiedFixes.title',
    subtitle: 'recommendationGroups.verifiedFixes.subtitle',
  },
  estimatedOpportunities: {
    title: 'recommendationGroups.estimatedOpportunities.title',
    subtitle: 'recommendationGroups.estimatedOpportunities.subtitle',
  },
  needsDeeperScan: {
    title: 'recommendationGroups.needsDeeperScan.title',
    subtitle: 'recommendationGroups.needsDeeperScan.subtitle',
  },
} as const;

export const COVERAGE_REASON_KEYS = {
  browser_disabled: 'results.coverage.reasons.browser_disabled',
  browser_launch_failed: 'results.coverage.reasons.browser_launch_failed',
  browser_sampling_failed: 'results.coverage.reasons.browser_sampling_failed',
  pagespeed_unavailable: 'results.coverage.reasons.pagespeed_unavailable',
  no_product_urls: 'results.coverage.reasons.no_product_urls',
  product_sampling_failed: 'results.coverage.reasons.product_sampling_failed',
  deep_scan_no_samples: 'results.coverage.reasons.deep_scan_no_samples',
  competitor_no_verified_data: 'results.coverage.reasons.competitor_no_verified_data',
  competitor_failed: 'results.coverage.reasons.competitor_failed',
  email_pending: 'results.coverage.reasons.email_pending',
  email_failed: 'results.coverage.reasons.email_failed',
  email_unconfigured: 'results.coverage.reasons.email_unconfigured',
  lead_failed: 'results.coverage.reasons.lead_failed',
  lead_unconfigured: 'results.coverage.reasons.lead_unconfigured',
} as const;

export type CoverageReasonKey = keyof typeof COVERAGE_REASON_KEYS;

export function getAnalyzerSectionKey(key: string): AnalyzerSectionTranslationKey {
  if (key in ANALYZER_SECTION_KEYS) {
    return ANALYZER_SECTION_KEYS[key as keyof typeof ANALYZER_SECTION_KEYS];
  }
  throw new Error(`Unknown analyzer section key: ${key}`);
}

export function getMarketPositionKey(position: string) {
  if (position in MARKET_POSITION_KEYS) {
    return MARKET_POSITION_KEYS[position as keyof typeof MARKET_POSITION_KEYS];
  }
  return MARKET_POSITION_KEYS.unknown;
}

export function getMarketConfidenceKey(confidence: string) {
  if (confidence in MARKET_CONFIDENCE_KEYS) {
    return MARKET_CONFIDENCE_KEYS[confidence as keyof typeof MARKET_CONFIDENCE_KEYS];
  }
  return MARKET_CONFIDENCE_KEYS.low;
}

export function getAiStatusKey(status: string) {
  if (status in AI_STATUS_KEYS) {
    return AI_STATUS_KEYS[status as keyof typeof AI_STATUS_KEYS];
  }
  return AI_STATUS_KEYS.not_optimized;
}

export function getAiSchemaStatusKey(status: string) {
  if (status in AI_SCHEMA_STATUS_KEYS) {
    return AI_SCHEMA_STATUS_KEYS[status as keyof typeof AI_SCHEMA_STATUS_KEYS];
  }
  return AI_SCHEMA_STATUS_KEYS.not_verified;
}

export function getProductCartStatusKey(status: string) {
  if (status in PRODUCT_CART_STATUS_KEYS) {
    return PRODUCT_CART_STATUS_KEYS[status as keyof typeof PRODUCT_CART_STATUS_KEYS];
  }
  return PRODUCT_CART_STATUS_KEYS.unknown;
}

export function getAnalysisConfidenceKey(confidence: string) {
  if (confidence in ANALYSIS_CONFIDENCE_KEYS) {
    return ANALYSIS_CONFIDENCE_KEYS[confidence as keyof typeof ANALYSIS_CONFIDENCE_KEYS];
  }
  return ANALYSIS_CONFIDENCE_KEYS.insufficient_evidence;
}

export function getImpactKey(impact: string) {
  if (impact in IMPACT_KEYS) {
    return IMPACT_KEYS[impact as keyof typeof IMPACT_KEYS];
  }
  return IMPACT_KEYS.medium;
}

export function getRoadmapWeekKeys(weekKey: string) {
  if (weekKey in ROADMAP_WEEK_KEYS) {
    return ROADMAP_WEEK_KEYS[weekKey as keyof typeof ROADMAP_WEEK_KEYS];
  }
  throw new Error(`Unknown roadmap week key: ${weekKey}`);
}

export function getRecommendationGroupKeys(groupKey: string) {
  if (groupKey in RECOMMENDATION_GROUP_KEYS) {
    return RECOMMENDATION_GROUP_KEYS[groupKey as keyof typeof RECOMMENDATION_GROUP_KEYS];
  }
  throw new Error(`Unknown recommendation group key: ${groupKey}`);
}

export function getCoverageReasonKey(reason: CoverageReasonKey) {
  return COVERAGE_REASON_KEYS[reason];
}

export const EFFORT_KEYS = {
  quick: 'recommendations.effort.quick',
  medium: 'recommendations.effort.medium',
  advanced: 'recommendations.effort.advanced',
} as const;

export type EffortTranslationKey = (typeof EFFORT_KEYS)[keyof typeof EFFORT_KEYS];

export function getEffortKey(effort: string): EffortTranslationKey {
  if (effort in EFFORT_KEYS) {
    return EFFORT_KEYS[effort as keyof typeof EFFORT_KEYS];
  }
  throw new Error(`Unknown effort key: ${effort}`);
}

type HasKeyTranslator = {
  has: (key: never) => boolean;
  (key: never): string;
};

export function translateIfExists(t: HasKeyTranslator, key: string, fallback: string): string {
  type Key = Parameters<HasKeyTranslator['has']>[0];
  return t.has(key as Key) ? t(key as Key) : fallback;
}

export function isCoverageReasonCode(code: string): code is CoverageReasonKey {
  return code in COVERAGE_REASON_KEYS;
}
