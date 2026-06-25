import type { AnalysisResult } from '@/lib/types/analyzer';

const defaultMeta: AnalysisResult['meta'] = {
  usedLighthouse: false,
  usedHtmlFallback: false,
  visualAnalysisAttempted: false,
  visualAnalysisAvailable: false,
  productAnalysisAvailable: false,
  deeperScanAvailable: false,
  competitorAnalysisAvailable: false,
  cached: false,
  leadCaptureStatus: undefined,
};

function withDefaultScanScope(result: AnalysisResult): AnalysisResult {
  const scanScope = result.scanScope ||
    result.meta?.scanScope || {
      scannedUrls: [result.storeUrl],
      homepageScanned: true,
      productPagesScanned: false,
      productPageCountAttempted: 0,
      productPageCountSucceeded: 0,
      productSchemaCoverageStatus: 'not_scanned' as const,
      productSchemaEvidence: [],
      notes: ['Product pages were not scanned, so product schema coverage could not be verified.'],
    };

  return {
    ...result,
    scanScope,
    competitorAnalysis:
      result.competitorAnalysis &&
      result.competitorAnalysis.competitors?.some(comp => !comp.domainClassification)
        ? {
            ...result.competitorAnalysis,
            competitors: [],
            marketPosition: 'unknown',
            confidence: 'low',
            summary: 'No direct competitors could be identified confidently from the scanned page.',
            analysisConfidence: 'insufficient_evidence',
            scannedUrlScope: scanScope.scannedUrls,
            limitations: [
              'Legacy cached competitor candidates did not include evidence fields and were suppressed.',
            ],
          }
        : result.competitorAnalysis,
    meta: {
      ...result.meta,
      scanScope,
      competitorAnalysisAvailable:
        result.competitorAnalysis?.competitors?.some(comp => Boolean(comp.domainClassification)) ??
        result.meta?.competitorAnalysisAvailable,
    },
    aiAnalysis: result.aiAnalysis
      ? {
          ...result.aiAnalysis,
          label: result.aiAnalysis.label ?? 'Content & structured-data readiness',
          confidence: result.aiAnalysis.confidence ?? 'insufficient_evidence',
          evidence: result.aiAnalysis.evidence ?? [],
          limitations:
            result.aiAnalysis.limitations ??
            ['Older cached analysis did not include readiness limitations.'],
          scannedScope: result.aiAnalysis.scannedScope ?? scanScope,
        }
      : result.aiAnalysis,
  };
}

/** Strips heavy screenshot payloads from API responses; full captures stay in the emailed PDF. */
export function serializeAnalysisForClient(result: AnalysisResult): AnalysisResult {
  const normalized = withDefaultScanScope(result);
  const meta = { ...defaultMeta, ...normalized.meta };

  if (!normalized.visualAnalysis?.screenshots?.length) {
    return { ...normalized, meta };
  }

  return {
    ...normalized,
    visualAnalysis: {
      contrastIssues: normalized.visualAnalysis.contrastIssues,
      mobileResponsivenessScore: normalized.visualAnalysis.mobileResponsivenessScore,
      dominantColors: normalized.visualAnalysis.dominantColors,
      screenshots: [],
    },
    meta: {
      ...meta,
      screenshotsInEmailReport: true,
    },
  };
}
