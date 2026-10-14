import type { AnalysisResult, Recommendation } from '@/lib/types/analyzer';
import type { PrimaryIssue } from '@/lib/analyzer/funnel';

type SectionKey = keyof AnalysisResult['sections'];

const confidenceRank: Record<NonNullable<Recommendation['confidence']>, number> = {
  measured: 4,
  verified: 3,
  estimated: 1,
  insufficient_evidence: 0,
  unavailable: 0,
};

const impactRank: Record<Recommendation['impact'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Prioritize actionable evidence, rather than treating an estimated low score as a sales signal. */
export function buildAnalyzerLeadIntelligence(result: AnalysisResult, primaryIssue: PrimaryIssue) {
  const sections = Object.entries(result.sections) as Array<
    [SectionKey, AnalysisResult['sections'][SectionKey]]
  >;
  const candidates = sections.flatMap(([sectionKey, section]) =>
    section.recommendations
      .filter(rec => !rec.excludeFromActionPlan && confidenceRank[rec.confidence ?? 'estimated'] > 0)
      .map(rec => ({ sectionKey, section, rec }))
  );

  candidates.sort((a, b) =>
    confidenceRank[b.rec.confidence ?? 'estimated'] - confidenceRank[a.rec.confidence ?? 'estimated'] ||
    impactRank[b.rec.impact] - impactRank[a.rec.impact] ||
    a.section.score - b.section.score
  );

  const strongest = candidates[0];
  const fallback = sections.sort((a, b) => a[1].score - b[1].score)[0];

  return {
    focusArea: strongest?.sectionKey ?? fallback[0],
    focusScore: strongest?.section.score ?? fallback[1].score,
    primaryRecommendation: strongest?.rec.title,
    metadata: {
      primaryIssue,
      scanMethod: result.meta.usedLighthouse ? 'lighthouse_mobile' : 'html_heuristics',
      reportPartial: result.meta.usedHtmlFallback,
      confirmedProductPages: result.scanScope?.productPageCountSucceeded ?? 0,
      visualEvidenceAvailable: result.meta.visualAnalysisAvailable,
      detailedScanAvailable: result.meta.deeperScanAvailable ?? false,
      strongEvidenceFindings: candidates.filter(
        item => confidenceRank[item.rec.confidence ?? 'estimated'] >= 3
      ).length,
      topRecommendationSource: strongest?.rec.source ?? 'unavailable',
      topEvidence: (strongest?.rec.evidence || strongest?.rec.exactEvidence?.[0] || '').slice(0, 280),
      followUpReadiness:
        candidates.some(item => confidenceRank[item.rec.confidence ?? 'estimated'] >= 3)
          ? 'evidence_ready'
          : 'needs_manual_validation',
    },
  };
}
