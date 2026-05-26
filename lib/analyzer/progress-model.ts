export type AnalyzerProgressPhase =
  | 'connecting'
  | 'performance'
  | 'seo'
  | 'ux'
  | 'trust'
  | 'generating';

export const ANALYZER_PHASE_ORDER: AnalyzerProgressPhase[] = [
  'connecting',
  'performance',
  'seo',
  'ux',
  'trust',
  'generating',
];

export const ANALYZER_PHASE_START_MS: Record<AnalyzerProgressPhase, number> = {
  connecting: 0,
  performance: 3_000,
  seo: 10_000,
  ux: 18_000,
  trust: 28_000,
  generating: 38_000,
};

/** Asymptotic progress capped at 85% until the caller sets complete. */
export function progressFromElapsedMs(elapsedMs: number): number {
  const capped = Math.min(elapsedMs, 90_000);
  const raw = 85 * (1 - Math.exp(-capped / 22_000));
  return Math.min(85, Math.round(raw));
}

export function phaseFromElapsedMs(elapsedMs: number): AnalyzerProgressPhase {
  let phase: AnalyzerProgressPhase = 'connecting';
  for (const candidate of ANALYZER_PHASE_ORDER) {
    if (elapsedMs >= ANALYZER_PHASE_START_MS[candidate]) {
      phase = candidate;
    }
  }
  return phase;
}
