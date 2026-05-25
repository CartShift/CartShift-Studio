'use client';

import { useEffect, useState } from 'react';
import {
  phaseFromElapsedMs,
  progressFromElapsedMs,
  type AnalyzerProgressPhase,
} from '@/lib/analyzer/progress-model';

export type { AnalyzerProgressPhase };

export function useAnalyzerProgress(active: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (!active) {
      setElapsedMs(0);
      setComplete(false);
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);

    return () => window.clearInterval(interval);
  }, [active]);

  const progress = complete ? 100 : progressFromElapsedMs(elapsedMs);
  const phase = complete ? 'generating' : phaseFromElapsedMs(elapsedMs);

  return {
    elapsedMs,
    progress,
    phase,
    markComplete: () => setComplete(true),
    reset: () => {
      setElapsedMs(0);
      setComplete(false);
    },
  };
}
