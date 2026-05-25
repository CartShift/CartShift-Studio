import { describe, expect, it } from 'vitest';
import {
  ANALYZER_PHASE_START_MS,
  phaseFromElapsedMs,
  progressFromElapsedMs,
} from '@/lib/analyzer/progress-model';

describe('analyzer progress model', () => {
  it('ramps slowly and caps below 85% until complete', () => {
    expect(progressFromElapsedMs(0)).toBe(0);
    expect(progressFromElapsedMs(5_000)).toBeGreaterThan(10);
    expect(progressFromElapsedMs(5_000)).toBeLessThan(30);
    expect(progressFromElapsedMs(60_000)).toBeLessThanOrEqual(85);
    expect(progressFromElapsedMs(120_000)).toBeLessThanOrEqual(85);
  });

  it('advances phases at configured thresholds', () => {
    expect(phaseFromElapsedMs(0)).toBe('connecting');
    expect(phaseFromElapsedMs(ANALYZER_PHASE_START_MS.performance)).toBe('performance');
    expect(phaseFromElapsedMs(ANALYZER_PHASE_START_MS.seo)).toBe('seo');
    expect(phaseFromElapsedMs(ANALYZER_PHASE_START_MS.ux)).toBe('ux');
    expect(phaseFromElapsedMs(ANALYZER_PHASE_START_MS.trust)).toBe('trust');
    expect(phaseFromElapsedMs(ANALYZER_PHASE_START_MS.generating)).toBe('generating');
  });
});
