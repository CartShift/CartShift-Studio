import type { AnalysisSource, AnalysisConfidence, Recommendation } from '@/lib/types/analyzer';

export function createRecommendation(
  code: string,
  title: string,
  impact: Recommendation['impact'],
  description: string,
  action: string,
  evidence?: string,
  effort: Recommendation['effort'] = impact === 'high' ? 'medium' : 'quick',
  source: AnalysisSource = 'heuristic',
  confidence: AnalysisConfidence = 'estimated',
  scannedUrlScope: string[] = [],
  limitation?: string
): Recommendation {
  return {
    code,
    title,
    impact,
    description,
    action,
    evidence,
    effort,
    serviceLink: '/contact',
    source,
    confidence,
    scannedUrlScope,
    exactEvidence: evidence ? [evidence] : [],
    limitation,
  };
}
