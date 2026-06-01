import type { AnalysisResult } from '@/lib/types/analyzer';

const defaultMeta: AnalysisResult['meta'] = {
  usedLighthouse: false,
  usedHtmlFallback: false,
  visualAnalysisAttempted: false,
  visualAnalysisAvailable: false,
  productAnalysisAvailable: false,
  competitorAnalysisAvailable: false,
  cached: false,
  leadCaptureStatus: undefined,
};

/** Strips heavy screenshot payloads from API responses; full captures stay in the emailed PDF. */
export function serializeAnalysisForClient(result: AnalysisResult): AnalysisResult {
  const meta = { ...defaultMeta, ...result.meta };

  if (!result.visualAnalysis?.screenshots?.length) {
    return { ...result, meta };
  }

  return {
    ...result,
    visualAnalysis: {
      contrastIssues: result.visualAnalysis.contrastIssues,
      mobileResponsivenessScore: result.visualAnalysis.mobileResponsivenessScore,
      dominantColors: result.visualAnalysis.dominantColors,
      screenshots: [],
    },
    meta: {
      ...meta,
      screenshotsInEmailReport: true,
    },
  };
}
